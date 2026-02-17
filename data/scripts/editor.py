import json
import os
from flask import Flask, render_template_string, request, jsonify, redirect, url_for, send_from_directory

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
app = Flask(__name__, static_folder=SCRIPT_DIR, static_url_path="/static")

DATA_DIR = os.path.normpath(os.path.join(os.path.dirname(__file__), ".."))

SCHEMA = {
    "films": {
        "pk": "film_id",
        "fields": {
            "film_id": {"type": "text", "required": True},
            "film_name": {"type": "text", "required": True},
            "film_iso": {"type": "number", "required": True},
            "film_description": {"type": "text", "required": False},
            "film_type": {"type": "select", "required": True, "options": [
                "black & white", "color (C-41)", "color (E-6)", "special"
            ]},
            "film_popularity": {"type": "number", "required": False},
            "film_datasheet": {"type": "text", "required": False},
            "film_lomography_id": {"type": "text", "required": False},
            "film_flickr_search": {"type": "text", "required": False},
        },
    },
    "sizes": {
        "pk": "size_id",
        "fields": {
            "size_id": {"type": "text", "required": True, "computed": ["film_id", "size_format"]},
            "film_id": {"type": "fk", "required": True, "ref": "films"},
            "size_format": {"type": "select", "required": True, "options": [
                "110", "120", "127", "135", "4x5", "8x10"
            ]},
            "size_year": {"type": "number", "required": False},
        },
    },
    "packs": {
        "pk": "pack_id",
        "fields": {
            "pack_id": {"type": "text", "required": True, "computed": ["size_id", "pack_count"]},
            "size_id": {"type": "fk", "required": True, "ref": "sizes"},
            "pack_count": {"type": "number", "required": True},
        },
    },
    "stores": {
        "pk": "store_id",
        "fields": {
            "store_id": {"type": "text", "required": True},
            "store_name": {"type": "text", "required": True},
            "store_url": {"type": "text", "required": True},
            "store_culture": {"type": "text", "required": False},
            "store_price_selector": {"type": "text", "required": False},
            "store_availability_selector": {"type": "text", "required": False},
        },
    },
    "pages": {
        "pk": None,
        "fields": {
            "pack_id": {"type": "fk", "required": True, "ref": "packs"},
            "store_id": {"type": "fk", "required": True, "ref": "stores"},
            "page_url": {"type": "text", "required": True},
        },
    },
}


def load_data(table):
    path = os.path.join(DATA_DIR, f"{table}.json")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_data(table, data):
    path = os.path.join(DATA_DIR, f"{table}.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")


def get_display_name(table, row):
    schema = SCHEMA[table]
    pk = schema["pk"]
    if pk:
        return row[pk]
    fields = list(schema["fields"].keys())
    return " | ".join(str(row.get(f, "")) for f in fields[:2])


# --- API ---

@app.route("/api/<table>", methods=["GET"])
def api_list(table):
    if table not in SCHEMA:
        return jsonify({"error": "Unknown table"}), 404
    return jsonify(load_data(table))


@app.route("/api/<table>", methods=["POST"])
def api_create(table):
    if table not in SCHEMA:
        return jsonify({"error": "Unknown table"}), 404
    data = load_data(table)
    row = request.json
    schema = SCHEMA[table]
    for field, spec in schema["fields"].items():
        if spec["type"] == "number" and field in row and row[field] is not None:
            try:
                row[field] = int(row[field])
            except (ValueError, TypeError):
                pass
        if row.get(field) == "" and not spec["required"]:
            row[field] = None
    data.append(row)
    pk = schema["pk"]
    if pk:
        data.sort(key=lambda r: r.get(pk, ""))
    save_data(table, data)
    return jsonify({"ok": True})


@app.route("/api/<table>/<int:index>", methods=["PUT"])
def api_update(table, index):
    if table not in SCHEMA:
        return jsonify({"error": "Unknown table"}), 404
    data = load_data(table)
    if index < 0 or index >= len(data):
        return jsonify({"error": "Index out of range"}), 404
    row = request.json
    schema = SCHEMA[table]
    for field, spec in schema["fields"].items():
        if spec["type"] == "number" and field in row and row[field] is not None:
            try:
                row[field] = int(row[field])
            except (ValueError, TypeError):
                pass
        if row.get(field) == "" and not spec["required"]:
            row[field] = None
    data[index] = row
    save_data(table, data)
    return jsonify({"ok": True})


@app.route("/api/<table>/<int:index>", methods=["DELETE"])
def api_delete(table, index):
    if table not in SCHEMA:
        return jsonify({"error": "Unknown table"}), 404
    data = load_data(table)
    if index < 0 or index >= len(data):
        return jsonify({"error": "Index out of range"}), 404
    data.pop(index)
    save_data(table, data)
    return jsonify({"ok": True})


@app.route("/api/fk_options/<table>")
def api_fk_options(table):
    if table not in SCHEMA:
        return jsonify({"error": "Unknown table"}), 404
    data = load_data(table)
    pk = SCHEMA[table]["pk"]
    if not pk:
        return jsonify([])
    return jsonify(sorted(set(row[pk] for row in data)))



# --- UI ---

TEMPLATE = r"""
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>analog films</title>
<link rel="stylesheet" href="/static/oat.min.css">
<link rel="stylesheet" href="/static/editor.css">
<script src="/static/oat.min.js" defer></script>
</head>
<body data-sidebar-layout data-table="{{ table }}">

<aside data-sidebar>
  <header><strong>analog films</strong></header>
  <nav>
    <ul>
      {% for t in tables %}
      <li><a href="/{{ t }}" {{ 'aria-current="page"' | safe if t == table else '' }}>{{ t }}</a></li>
      {% endfor %}
    </ul>
  </nav>
  <footer>
    <label>
      <input type="checkbox" role="switch" id="theme-toggle" onchange="toggleTheme()">
      Dark mode
    </label>
  </footer>
</aside>

<main style="padding: var(--space-3);">
  <div class="toolbar">
    <h2>{{ table }} <span class="count" id="count"></span></h2>
    <fieldset class="group">
      <input type="search" id="search" placeholder="Filter rows...">
      <button onclick="openCreate()">+ Add</button>
    </fieldset>
  </div>

  <div class="table-wrap">
    <table>
      <thead><tr id="thead"></tr></thead>
      <tbody id="tbody"></tbody>
    </table>
  </div>
</main>

<dialog id="modal" closedby="any">
  <form method="dialog" id="form" onsubmit="return handleSubmit(event)">
    <header><h3 id="modal-title">Add</h3></header>
    <div id="form-fields"></div>
    <footer>
      <button type="button" class="outline" onclick="closeModal()">Cancel</button>
      <button type="submit" id="submit-btn">Save</button>
    </footer>
  </form>
</dialog>

<script id="schema-data" type="application/json">{{ schema_json | safe }}</script>
<script src="/static/editor.js"></script>
</body>
</html>
"""


@app.route("/")
def index():
    return redirect(url_for("table_view", table="films"))


@app.route("/<table>")
def table_view(table):
    if table not in SCHEMA:
        return "Not found", 404
    return render_template_string(
        TEMPLATE,
        table=table,
        tables=list(SCHEMA.keys()),
        schema_json=json.dumps(SCHEMA),
    )


if __name__ == "__main__":
    print(f"Data directory: {DATA_DIR}")
    print(f"Opening editor at http://127.0.0.1:5000")
    app.run(host="127.0.0.1", port=5000, debug=True)
