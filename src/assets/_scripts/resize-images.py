#!/usr/bin/env python3
"""
Resize images from images/ to 250x200 and save in images/small/.
Expects 500x400 AVIF source images (as produced by process-images.py).

Usage:
    python scripts/resize-images.py

Requires:
    pip install Pillow
"""

import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow is required: pip install Pillow")

INPUT_DIR = Path(__file__).resolve().parent.parent / "images"
OUTPUT_DIR = INPUT_DIR / "small"
TARGET_WIDTH = 250
TARGET_HEIGHT = 200


def main() -> None:
    if not INPUT_DIR.exists():
        sys.exit(f"Input directory not found: {INPUT_DIR}")

    images = sorted(
        p for p in INPUT_DIR.iterdir()
        if p.is_file() and p.suffix.lower() == ".avif"
    )

    if not images:
        sys.exit(f"No AVIF images found in {INPUT_DIR}")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Resizing {len(images)} image(s) to {TARGET_WIDTH}x{TARGET_HEIGHT}")
    print(f"  {INPUT_DIR} -> {OUTPUT_DIR}")
    print()

    for i, path in enumerate(images, 1):
        print(f"[{i}/{len(images)}] {path.name} ... ", end="", flush=True)
        try:
            img = Image.open(path)
            img = img.resize((TARGET_WIDTH, TARGET_HEIGHT), Image.LANCZOS)
            img.save(OUTPUT_DIR / path.name, "AVIF", quality=63)
            print("done")
        except Exception as e:
            print(f"FAILED: {e}")

    print("\nFinished.")


if __name__ == "__main__":
    main()
