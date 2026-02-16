#!/usr/bin/env python3
"""
Batch process film box images:
1. Remove background using rembg (AI-based)
2. Trim to subject bounding box
3. Resize to fit within 500x400, centered on transparent canvas
4. Save as optimized AVIF

Usage:
    python scripts/process-images.py

Requires:
    pip install rembg Pillow
"""

import sys
from pathlib import Path

try:
    from PIL import Image, ImageEnhance, ImageStat
except ImportError:
    sys.exit("Pillow is required: pip install Pillow")

try:
    from rembg import remove
except ImportError:
    sys.exit("rembg is required: pip install rembg")

INPUT_DIR = Path(__file__).resolve().parent.parent / "_images"
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "images"
OUTPUT_DIR_SMALL = OUTPUT_DIR / "small"
PADDING_RATIO = 0.1  # 10% of canvas size per side (50px on 500x400, 25px on 250x200)
SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".tiff", ".bmp"}

SIZES = [
    (500, 400, OUTPUT_DIR),
    (250, 200, OUTPUT_DIR_SMALL),
]

# Target RMS contrast for normalisation (0-127 range typical for product photos)
TARGET_CONTRAST_RMS = 80


def normalize_contrast(img: Image.Image) -> Image.Image:
    """Adjust contrast so all images reach a consistent RMS contrast level.
    Only boosts flat images; already-contrasty images are left unchanged."""
    rgb = img.convert("RGB")
    stat = ImageStat.Stat(rgb, mask=img.split()[3])  # only measure opaque pixels
    # RMS contrast: average of per-channel stddev
    rms = sum(stat.stddev) / 3
    if rms <= 0 or rms >= TARGET_CONTRAST_RMS:
        return img
    factor = TARGET_CONTRAST_RMS / rms
    # Cap the boost to avoid blowing out low-contrast images
    factor = min(factor, 1.5)
    enhanced = ImageEnhance.Contrast(img).enhance(factor)
    # Preserve original alpha channel
    enhanced.putalpha(img.split()[3])
    return enhanced


def create_canvas(img: Image.Image, width: int, height: int) -> Image.Image:
    """Resize img to fit within the content area (canvas minus proportional padding),
    then center it on a transparent canvas of width x height."""
    pad_x = int(width * PADDING_RATIO)
    pad_y = int(height * PADDING_RATIO)
    content_w = width - 2 * pad_x
    content_h = height - 2 * pad_y
    img_copy = img.copy()
    img_copy.thumbnail((content_w, content_h), Image.LANCZOS)

    canvas = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    offset_x = (width - img_copy.width) // 2
    offset_y = (height - img_copy.height) // 2
    canvas.paste(img_copy, (offset_x, offset_y))
    return canvas


def process_image(input_path: Path, filename: str) -> None:
    with open(input_path, "rb") as f:
        input_data = f.read()

    # Remove background with alpha matting for cleaner edges
    output_data = remove(
        input_data,
        alpha_matting=True,
        alpha_matting_foreground_threshold=240,
        alpha_matting_background_threshold=10,
        alpha_matting_erode_size=10,
    )

    img = Image.open(__import__("io").BytesIO(output_data)).convert("RGBA")

    # Trim transparent pixels to get the subject bounding box
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)

    # Normalize contrast across images
    img = normalize_contrast(img)

    # Save each size variant
    for width, height, out_dir in SIZES:
        canvas = create_canvas(img, width, height)
        out_dir.mkdir(parents=True, exist_ok=True)
        canvas.save(out_dir / filename, "AVIF", quality=63)


def main() -> None:
    if not INPUT_DIR.exists():
        sys.exit(f"Input directory not found: {INPUT_DIR}")

    images = sorted(
        p for p in INPUT_DIR.iterdir()
        if p.suffix.lower() in SUPPORTED_EXTENSIONS
    )

    if not images:
        sys.exit(f"No supported images found in {INPUT_DIR}")

    print(f"Processing {len(images)} image(s) from {INPUT_DIR}")
    for width, height, out_dir in SIZES:
        print(f"  {width}x{height} -> {out_dir}")
    print()

    for i, path in enumerate(images, 1):
        filename = f"{path.stem}.avif"
        print(f"[{i}/{len(images)}] {path.name} -> {filename} ... ", end="", flush=True)
        try:
            process_image(path, filename)
            print("done")
        except Exception as e:
            print(f"FAILED: {e}")

    print("\nFinished.")


if __name__ == "__main__":
    main()
