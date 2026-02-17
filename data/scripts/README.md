# Data Editor

A local web UI for editing the JSON data files in `data/`.

## Requirements

- Python 3.8+

## Setup

```
cd data/scripts
python -m venv .venv
```

Activate the virtual environment:

- **Linux / macOS:** `source .venv/bin/activate`
- **Windows (PowerShell):** `.venv\bin\Activate.ps1`
- **Windows (cmd):** `.venv\bin\activate.bat`
- **Windows (Git Bash):** `source .venv/bin/activate`

Then install dependencies:

```
pip install -r requirements.txt
```

## Usage

With the virtual environment activated:

```
python editor.py
```

Then open http://127.0.0.1:5000 in your browser.
