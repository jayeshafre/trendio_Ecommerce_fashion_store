"""
Image downloader for bulk upload.

Downloads images from URLs and saves them to:
    /media/images/products/{product_id}/img{n}.jpg

Rules:
  - Timeout: 10 seconds per image
  - Max size: 5 MB per image
  - Unsupported type / download failure → skip, use no image
  - Saves as JPEG regardless of source format
"""
import logging
import os
import time
from pathlib import Path

import requests
from django.conf import settings
from PIL import Image as PILImage
import io

logger = logging.getLogger(__name__)

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_IMAGE_SIZE_BYTES  = 5 * 1024 * 1024  # 5 MB
REQUEST_TIMEOUT       = 10               # seconds


def download_and_save_images(product_id: str, image_urls: list[str]) -> list[str]:
    """
    Download a list of image URLs for a product.

    Returns:
        List of saved relative paths (relative to MEDIA_ROOT).
        e.g. ["images/products/{id}/img1.jpg", "images/products/{id}/img2.jpg"]

    Failed downloads are skipped silently (logged at WARNING level).
    """
    if not image_urls:
        return []

    # Create target directory
    target_dir = Path(settings.MEDIA_ROOT) / "images" / "products" / str(product_id)
    target_dir.mkdir(parents=True, exist_ok=True)

    saved_paths = []

    for idx, url in enumerate(image_urls, start=1):
        try:
            saved = _download_single(url, target_dir, idx)
            if saved:
                # Store relative path (relative to MEDIA_ROOT)
                rel = os.path.relpath(saved, settings.MEDIA_ROOT)
                saved_paths.append(rel)
        except Exception as e:
            logger.warning(f"Image download failed for product {product_id}, url={url}: {e}")
            continue

    return saved_paths


def _download_single(url: str, target_dir: Path, idx: int) -> str | None:
    """Download one image and return the saved file path."""
    headers = {
        "User-Agent": "Trendio-BulkUpload/1.0 (product image downloader)",
        "Accept": "image/*",
    }

    response = requests.get(url, headers=headers, timeout=REQUEST_TIMEOUT, stream=True)

    if response.status_code != 200:
        logger.warning(f"HTTP {response.status_code} for image URL: {url}")
        return None

    # Validate content type
    content_type = response.headers.get("Content-Type", "").split(";")[0].strip()
    if content_type not in ALLOWED_CONTENT_TYPES:
        logger.warning(f"Unsupported content type '{content_type}' for URL: {url}")
        return None

    # Read with size limit
    chunks = []
    total  = 0
    for chunk in response.iter_content(chunk_size=8192):
        total += len(chunk)
        if total > MAX_IMAGE_SIZE_BYTES:
            logger.warning(f"Image too large (>{MAX_IMAGE_SIZE_BYTES} bytes): {url}")
            return None
        chunks.append(chunk)

    raw_bytes = b"".join(chunks)

    # Convert to JPEG using Pillow (normalises format)
    try:
        img = PILImage.open(io.BytesIO(raw_bytes))
        img = img.convert("RGB")  # handle RGBA/palette images
        out = io.BytesIO()
        img.save(out, format="JPEG", quality=85, optimize=True)
        out.seek(0)
        jpeg_bytes = out.read()
    except Exception as e:
        logger.warning(f"Could not process image as JPEG from {url}: {e}")
        return None

    # Save to disk
    filename  = f"img{idx}.jpg"
    file_path = target_dir / filename
    with open(file_path, "wb") as f:
        f.write(jpeg_bytes)

    logger.info(f"Image saved: {file_path}")
    return str(file_path)