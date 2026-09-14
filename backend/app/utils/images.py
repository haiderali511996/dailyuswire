"""Upload handling: validate, strip EXIF, resize, and emit WebP derivatives.

Every upload produces a full-size WebP plus a 480px thumbnail, which is what
keeps article pages fast on mobile (Core Web Vitals / LCP).
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image, ImageOps

from app.config import settings

ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"}
MAX_WIDTH = 1600
THUMB_WIDTH = 480


class UploadError(ValueError):
    pass


def _dated_dir() -> tuple[Path, str]:
    now = datetime.now(timezone.utc)
    rel = f"{now:%Y/%m}"
    path = settings.media_path / rel
    path.mkdir(parents=True, exist_ok=True)
    return path, rel


def save_image(data: bytes, original_name: str, mime: str) -> dict:
    if mime not in ALLOWED_MIME:
        raise UploadError(f"Unsupported file type: {mime}")
    if len(data) > settings.max_upload_mb * 1024 * 1024:
        raise UploadError(f"File is larger than {settings.max_upload_mb}MB")

    import io

    try:
        img = Image.open(io.BytesIO(data))
        img.verify()  # reject anything that is not a real image
        img = Image.open(io.BytesIO(data))
    except Exception as exc:  # noqa: BLE001 - Pillow raises many types
        raise UploadError("File is not a readable image") from exc

    img = ImageOps.exif_transpose(img)
    if img.mode not in ("RGB", "RGBA"):
        img = img.convert("RGBA" if "A" in img.getbands() else "RGB")

    stem = Path(original_name).stem[:60] or "image"
    from app.utils.text import slugify

    name = f"{slugify(stem)}-{uuid.uuid4().hex[:8]}"
    out_dir, rel = _dated_dir()

    full = img.copy()
    if full.width > MAX_WIDTH:
        full = full.resize(
            (MAX_WIDTH, round(full.height * MAX_WIDTH / full.width)), Image.LANCZOS
        )
    full_path = out_dir / f"{name}.webp"
    full.save(full_path, "WEBP", quality=82, method=5)

    thumb = img.copy()
    if thumb.width > THUMB_WIDTH:
        thumb = thumb.resize(
            (THUMB_WIDTH, round(thumb.height * THUMB_WIDTH / thumb.width)), Image.LANCZOS
        )
    thumb_path = out_dir / f"{name}-thumb.webp"
    thumb.save(thumb_path, "WEBP", quality=75, method=5)

    return {
        "filename": full_path.name,
        "url": f"/media/{rel}/{full_path.name}",
        "thumb_url": f"/media/{rel}/{thumb_path.name}",
        "mime": "image/webp",
        "width": full.width,
        "height": full.height,
        "size_bytes": full_path.stat().st_size,
    }
