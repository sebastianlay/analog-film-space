#!/usr/bin/env bash
# Sets up a Python virtual environment with dependencies
# needed for image processing scripts.
#
# Usage: bash scripts/setup.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VENV_DIR="$SCRIPT_DIR/../.venv"

echo "Creating virtual environment in $VENV_DIR ..."
python3 -m venv "$VENV_DIR"

echo "Installing dependencies ..."
"$VENV_DIR/bin/pip" install --upgrade pip
"$VENV_DIR/bin/pip" install "rembg[cpu]" "Pillow>=10.1" pillow-avif-plugin pymatting pooch

echo ""
echo "Running image processor ..."
"$VENV_DIR/bin/python" "$SCRIPT_DIR/process-images.py"
