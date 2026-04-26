"""
Error CSV generator for bulk upload.

Generates a downloadable CSV with row-level errors:
    row_number, sku, error

Saves to: /media/csvs/errors/{bulk_upload_id}_errors.csv
Returns the relative path for storage in BulkUpload.error_file.
"""
import csv
import io
import logging
from pathlib import Path

from django.conf import settings

logger = logging.getLogger(__name__)


def generate_error_csv(bulk_upload_id: str, errors: list[dict]) -> str | None:
    """
    Write an error CSV file and return its relative path from MEDIA_ROOT.

    Args:
        bulk_upload_id: UUID string of the BulkUpload record
        errors: list of dicts with keys: row, sku, error

    Returns:
        Relative path string (e.g. "csvs/errors/abc123_errors.csv")
        or None if no errors.
    """
    if not errors:
        return None

    # Ensure directory exists
    errors_dir = Path(settings.MEDIA_ROOT) / "csvs" / "errors"
    errors_dir.mkdir(parents=True, exist_ok=True)

    filename  = f"{bulk_upload_id}_errors.csv"
    file_path = errors_dir / filename

    try:
        with open(file_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=["row_number", "sku", "error"])
            writer.writeheader()
            for err in errors:
                writer.writerow({
                    "row_number": err.get("row", ""),
                    "sku":        err.get("sku", ""),
                    "error":      err.get("error", ""),
                })
        logger.info(f"Error report written: {file_path}")
        # Return relative path from MEDIA_ROOT
        import os
        return os.path.relpath(str(file_path), settings.MEDIA_ROOT)
    except Exception as e:
        logger.error(f"Failed to write error CSV: {e}")
        return None