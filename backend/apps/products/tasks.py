"""
Celery tasks for bulk product upload.

Task: process_bulk_upload
  - Triggered immediately after CSV is saved and BulkUpload record created
  - Reads and validates CSV
  - Processes rows in chunks of 500
  - UPSERT products by SKU (update if SKU exists, create if not)
  - Downloads images from URLs
  - Tracks progress in DB (so frontend can poll)
  - Generates error CSV if there are failures
  - Marks BulkUpload as completed or failed
"""
import logging
from collections import defaultdict
from datetime import datetime

from celery import shared_task
from django.db import transaction

from .models import Category, Product, ProductVariant, ProductImage, BulkUpload
from .bulk_upload.parser import parse_csv
from .bulk_upload.image_downloader import download_and_save_images
from .bulk_upload.error_reporter import generate_error_csv

logger = logging.getLogger(__name__)

CHUNK_SIZE = 500


@shared_task(bind=True, max_retries=0, name="products.process_bulk_upload")
def process_bulk_upload(self, bulk_upload_id: str):
    """
    Main Celery task for processing a bulk upload CSV.
    Runs asynchronously after the upload API returns.
    """
    try:
        upload = BulkUpload.objects.get(id=bulk_upload_id)
    except BulkUpload.DoesNotExist:
        logger.error(f"BulkUpload {bulk_upload_id} not found.")
        return

    # ── Mark as processing ─────────────────────────────────────
    upload.status = BulkUpload.Status.PROCESSING
    upload.save(update_fields=["status"])
    logger.info(f"[BulkUpload {bulk_upload_id}] Processing started.")

    all_errors = []

    try:
        # ── Step 1: Parse and validate CSV ─────────────────────
        with upload.file.open("rb") as f:
            try:
                clean_rows, parse_errors = parse_csv(f)
            except ValueError as e:
                # Fatal parse error (bad encoding, missing columns etc.)
                upload.status       = BulkUpload.Status.FAILED
                upload.failure_count = 0
                upload.save(update_fields=["status", "failure_count"])
                logger.error(f"[BulkUpload {bulk_upload_id}] Parse failed: {e}")
                return

        all_errors.extend(parse_errors)
        total = len(clean_rows) + len(parse_errors)

        upload.total_records = total
        upload.failure_count = len(parse_errors)
        upload.save(update_fields=["total_records", "failure_count"])

        if not clean_rows:
            _finish(upload, all_errors)
            return

        # ── Step 2: Group rows by (title, brand) ───────────────
        # Same title+brand = one product; each row = one variant
        groups = defaultdict(list)
        for row in clean_rows:
            key = (row["title"].lower(), row["brand"].lower())
            groups[key].append(row)

        # ── Step 3: Process in chunks ──────────────────────────
        all_group_items = list(groups.items())
        processed_variants = 0

        for chunk_start in range(0, len(all_group_items), CHUNK_SIZE):
            chunk = all_group_items[chunk_start : chunk_start + CHUNK_SIZE]

            for (title_key, brand_key), rows in chunk:
                first_row = rows[0]
                row_errors = _process_product_group(
                    title=first_row["title"],
                    brand=first_row["brand"],
                    rows=rows,
                )
                all_errors.extend(row_errors)
                success_in_group = len(rows) - len(row_errors)
                processed_variants += success_in_group

            # Update progress after each chunk
            upload.processed     = chunk_start + len(chunk)
            upload.success_count = processed_variants
            upload.failure_count = len(all_errors)
            upload.save(update_fields=["processed", "success_count", "failure_count"])
            logger.info(f"[BulkUpload {bulk_upload_id}] Chunk done. Success: {processed_variants}")

        # ── Step 4: Finish ─────────────────────────────────────
        _finish(upload, all_errors)

    except Exception as e:
        logger.exception(f"[BulkUpload {bulk_upload_id}] Unexpected error: {e}")
        upload.status = BulkUpload.Status.FAILED
        upload.save(update_fields=["status"])


def _process_product_group(title: str, brand: str, rows: list) -> list:
    """
    Create or update one Product and all its variants.
    Returns list of row-level error dicts for any failures.
    """
    errors    = []
    first_row = rows[0]

    try:
        with transaction.atomic():
            # ── Resolve category ──────────────────────────────
            category = None
            cat_slug = first_row.get("category_slug", "")
            if cat_slug:
                category, _ = Category.objects.get_or_create(
                    slug=cat_slug,
                    defaults={"name": cat_slug.replace("-", " ").title()},
                )

            # ── UPSERT Product ────────────────────────────────
            # Check if any variant SKU already exists → if so, update that product
            existing_sku = ProductVariant.objects.filter(
                sku__in=[r["sku"] for r in rows]
            ).select_related("product").first()

            if existing_sku:
                product = existing_sku.product
                # Update product fields
                product.brand      = brand
                product.category   = category
                product.base_price = first_row["base_price"]
                if first_row.get("sale_price"):
                    product.sale_price = first_row["sale_price"]
                if first_row.get("description"):
                    product.description = first_row["description"]
                product.save(update_fields=[
                    "brand", "category", "base_price", "sale_price", "description"
                ])
            else:
                product = Product.objects.create(
                    title       = title,
                    brand       = brand,
                    category    = category,
                    description = first_row.get("description", ""),
                    base_price  = first_row["base_price"],
                    sale_price  = first_row.get("sale_price"),
                    is_active   = True,
                )

            # ── Process each variant row ──────────────────────
            for row in rows:
                try:
                    _upsert_variant(product, row)
                except Exception as e:
                    errors.append({
                        "row":   row["row"],
                        "sku":   row["sku"],
                        "error": str(e),
                    })

            # ── Download images (from first row that has them) ─
            image_urls = []
            for row in rows:
                if row.get("image_urls"):
                    image_urls = row["image_urls"]
                    break

            if image_urls:
                saved_paths = download_and_save_images(str(product.id), image_urls)
                for idx, rel_path in enumerate(saved_paths):
                    ProductImage.objects.get_or_create(
                        product=product,
                        image=rel_path,
                        defaults={
                            "alt_text":   product.title,
                            "is_primary": idx == 0,
                            "order":      idx + 1,
                        },
                    )

    except Exception as e:
        logger.error(f"Product group '{title}' failed: {e}")
        for row in rows:
            errors.append({
                "row":   row["row"],
                "sku":   row["sku"],
                "error": f"Product creation failed: {e}",
            })

    return errors


def _upsert_variant(product: Product, row: dict):
    """Create or update a ProductVariant by SKU."""
    sku = row["sku"]

    variant, created = ProductVariant.objects.update_or_create(
        sku=sku,
        defaults={
            "product":   product,
            "size":      row.get("size", ""),
            "color":     row.get("color", ""),
            "color_hex": row.get("color_hex", ""),
            "stock":     row.get("stock", 0),
            "is_active": True,
        },
    )
    return variant


def _finish(upload: BulkUpload, all_errors: list):
    """Write error CSV if needed and mark upload complete."""
    if all_errors:
        error_path = generate_error_csv(str(upload.id), all_errors)
        if error_path:
            upload.error_file = error_path

    upload.failure_count  = len(all_errors)
    upload.status         = BulkUpload.Status.COMPLETED
    upload.completed_at   = datetime.now()
    upload.save(update_fields=[
        "status", "failure_count", "error_file", "completed_at"
    ])
    logger.info(
        f"[BulkUpload {upload.id}] Done. "
        f"Success: {upload.success_count} | Failed: {upload.failure_count}"
    )