#!/usr/bin/env bash
# Sets up a Python virtual environment (if needed) and resizes
# images from images/ to 250x200 in images/small/.
#
# Usage: bash scripts/resize-images.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VENV_DIR="$SCRIPT_DIR/../.venv"

if [ ! -d "$VENV_DIR" ]; then
    echo "Creating virtual environment in $VENV_DIR ..."
    python3 -m venv "$VENV_DIR"

    echo "Installing dependencies ..."
    "$VENV_DIR/bin/pip" install --upgrade pip
    "$VENV_DIR/bin/pip" install "Pillow>=10.1" pillow-avif-plugin
fi

echo ""
echo "Running image resizer ..."
"$VENV_DIR/bin/python" "$SCRIPT_DIR/resize-images.py"
