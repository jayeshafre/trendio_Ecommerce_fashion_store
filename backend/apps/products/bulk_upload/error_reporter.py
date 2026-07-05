"""
Error CSV generator for bulk upload.

Generates a downloadable CSV with row-level errors:
    row_number, sku, error

Saved via Django's default storage backend (local disk in dev, Cloudinary
in prod) at: csvs/errors/{bulk_upload_id}_errors.csv
Returns the storage path for storage in BulkUpload.error_file.
"""
import csv
import io
import logging

from django.core.files.base import ContentFile
from django.core.files.storage import default_storage

logger = logging.getLogger(__name__)


def generate_error_csv(bulk_upload_id: str, errors: list[dict]) -> str | None:
    """
    Write an error CSV file and return its storage path.

    Args:
        bulk_upload_id: UUID string of the BulkUpload record
        errors: list of dicts with keys: row, sku, error

    Returns:
        Storage path string (e.g. "csvs/errors/abc123_errors.csv")
        or None if no errors.
    """
    if not errors:
        return None

    filename = f"{bulk_upload_id}_errors.csv"
    storage_path = f"csvs/errors/{filename}"

    try:
        buffer = io.StringIO()
        writer = csv.DictWriter(buffer, fieldnames=["row_number", "sku", "error"])
        writer.writeheader()
        for err in errors:
            writer.writerow({
                "row_number": err.get("row", ""),
                "sku":        err.get("sku", ""),
                "error":      err.get("error", ""),
            })

        saved_name = default_storage.save(
            storage_path, ContentFile(buffer.getvalue().encode("utf-8"))
        )
        logger.info(f"Error report written via storage backend: {saved_name}")
        return saved_name
    except Exception as e:
        logger.error(f"Failed to write error CSV: {e}")
        return None