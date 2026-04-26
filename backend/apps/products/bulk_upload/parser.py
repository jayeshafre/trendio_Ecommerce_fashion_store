"""
CSV Parser & Validator for bulk product upload.

Rules:
  - One row = one variant
  - Rows with the same title + brand = one Product
  - Required: title, brand, category_slug, base_price, sku, stock
  - Optional: description, sale_price, size, color, color_hex, image_urls
  - image_urls: pipe-separated  →  https://img1.jpg|https://img2.jpg
  - Max 5,000 rows
  - Max file size: 10 MB (enforced in view)
"""
import csv
import io
import re
from decimal import Decimal, InvalidOperation
from urllib.parse import urlparse

MAX_ROWS = 5_000

REQUIRED_COLUMNS = {
    "title", "brand", "category_slug",
    "base_price", "sku", "stock",
}

VALID_URL_RE = re.compile(
    r"^https?://"
    r"(?:\S+(?::\S*)?@)?"
    r"(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])"
    r"(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}"
    r"(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|24[0-3]))"
    r"(?::\d{2,5})?"
    r"(?:/\S*)?$|"
    r"^https?://[a-zA-Z0-9\-._~:/?#\[\]@!$&'()*+,;=%]+$",
    re.IGNORECASE,
)


def is_valid_url(url: str) -> bool:
    try:
        result = urlparse(url.strip())
        return result.scheme in ("http", "https") and bool(result.netloc)
    except Exception:
        return False


def parse_csv(file_obj):
    """
    Read and validate a CSV file object.

    Returns:
        rows     (list[dict]) — cleaned, valid rows
        errors   (list[dict]) — {row: int, sku: str, error: str}
        warnings (list[str])  — non-fatal issues
    """
    try:
        raw = file_obj.read()
        # Handle both bytes and string
        if isinstance(raw, bytes):
            content = raw.decode("utf-8-sig")
        else:
            content = raw
    except UnicodeDecodeError:
        raise ValueError("File encoding error. Save your CSV as UTF-8.")

    reader     = csv.DictReader(io.StringIO(content))
    fieldnames = reader.fieldnames

    if not fieldnames:
        raise ValueError("CSV is empty or has no header row.")

    # Normalize header names (strip spaces, lowercase)
    normalized_headers = {h.strip().lower() for h in fieldnames}
    missing = REQUIRED_COLUMNS - normalized_headers
    if missing:
        raise ValueError(
            f"Missing required columns: {', '.join(sorted(missing))}. "
            f"Found: {', '.join(sorted(normalized_headers))}"
        )

    all_rows = list(reader)
    if not all_rows:
        raise ValueError("CSV has no data rows.")
    if len(all_rows) > MAX_ROWS:
        raise ValueError(f"Too many rows ({len(all_rows)}). Maximum is {MAX_ROWS}.")

    clean_rows = []
    errors     = []
    seen_skus  = {}  # sku → row_number (detect duplicates within this file)

    for i, raw_row in enumerate(all_rows, start=2):  # row 1 = headers
        # Normalize keys
        row = {k.strip().lower(): (v.strip() if v else "") for k, v in raw_row.items() if k}
        row_errors = []

        # ── Required field checks ──────────────────────────────
        title    = row.get("title", "")
        brand    = row.get("brand", "")
        cat_slug = row.get("category_slug", "").lower().strip()
        sku_raw  = row.get("sku", "").strip().upper()
        stock_raw = row.get("stock", "0").strip()

        if not title:
            row_errors.append("'title' is required.")
        if not brand:
            row_errors.append("'brand' is required.")
        if not cat_slug:
            row_errors.append("'category_slug' is required.")
        if not sku_raw:
            row_errors.append("'sku' is required.")

        # ── Price validation ───────────────────────────────────
        # Strip currency symbols (₹, $, etc.)
        price_str = re.sub(r"[^\d.]", "", row.get("base_price", ""))
        try:
            base_price = Decimal(price_str)
            if base_price <= 0:
                row_errors.append("'base_price' must be greater than 0.")
        except InvalidOperation:
            base_price = None
            row_errors.append(f"'base_price' is not a valid number (got: {row.get('base_price')}).")

        sale_price = None
        if row.get("sale_price", "").strip():
            sp_str = re.sub(r"[^\d.]", "", row["sale_price"])
            try:
                sale_price = Decimal(sp_str)
                if base_price and sale_price >= base_price:
                    row_errors.append("'sale_price' must be less than 'base_price'.")
            except InvalidOperation:
                row_errors.append(f"'sale_price' is not a valid number (got: {row['sale_price']}).")

        # ── Stock validation ───────────────────────────────────
        try:
            stock = int(stock_raw)
            if stock < 0:
                row_errors.append("'stock' must be 0 or more.")
        except ValueError:
            stock = 0
            row_errors.append(f"'stock' must be an integer (got: {stock_raw}).")

        # ── SKU duplicate check (within file) ─────────────────
        if sku_raw:
            if sku_raw in seen_skus:
                row_errors.append(
                    f"Duplicate SKU '{sku_raw}' — already appears at row {seen_skus[sku_raw]}."
                )
            else:
                seen_skus[sku_raw] = i

        # ── Image URLs (optional) ──────────────────────────────
        image_urls = []
        raw_urls   = row.get("image_urls", "").strip()
        if raw_urls:
            urls = [u.strip() for u in raw_urls.split("|") if u.strip()]
            for url in urls:
                if is_valid_url(url):
                    image_urls.append(url)
                else:
                    row_errors.append(f"Invalid image URL skipped: {url[:60]}")

        # ── Collect or record errors ───────────────────────────
        if row_errors:
            errors.append({
                "row":   i,
                "sku":   sku_raw or "—",
                "error": " | ".join(row_errors),
            })
            continue

        clean_rows.append({
            "row":           i,
            "title":         title,
            "brand":         brand,
            "category_slug": cat_slug,
            "description":   row.get("description", "").strip(),
            "base_price":    base_price,
            "sale_price":    sale_price,
            "sku":           sku_raw,
            "stock":         stock,
            "size":          row.get("size", "").strip(),
            "color":         row.get("color", "").strip(),
            "color_hex":     row.get("color_hex", "").strip(),
            "image_urls":    image_urls,
        })

    return clean_rows, errors