const TABLE = document.body.dataset.table;
const SCHEMA = JSON.parse(document.getElementById("schema-data").textContent);
const tableSchema = SCHEMA[TABLE];
const fields = Object.keys(tableSchema.fields);
let rows = [];
let editIndex = null;
const fkCache = {};

async function loadFkOptions(refTable) {
  if (fkCache[refTable]) return fkCache[refTable];
  const r = await fetch(`/api/fk_options/${refTable}`);
  const opts = await r.json();
  fkCache[refTable] = opts;
  return opts;
}

async function loadData() {
  const r = await fetch(`/api/${TABLE}`);
  rows = await r.json();
  render();
}

function render() {
  const q = document.getElementById("search").value.toLowerCase();
  const filtered = q ? rows.filter(r => JSON.stringify(r).toLowerCase().includes(q)) : rows;
  document.getElementById("count").textContent = `(${filtered.length}${q ? ` of ${rows.length}` : ''})`;

  let th = fields.map(f => `<th>${f}</th>`).join("") + "<th>Actions</th>";
  document.getElementById("thead").innerHTML = th;

  if (filtered.length === 0) {
    document.getElementById("tbody").innerHTML = `<tr><td colspan="${fields.length+1}">No rows found</td></tr>`;
    return;
  }
  let html = "";
  for (const row of filtered) {
    const realIdx = rows.indexOf(row);
    let cells = fields.map(f => {
      let v = row[f];
      if (v === null || v === undefined) return `<td><span class="badge">null</span></td>`;
      return `<td title="${String(v).replace(/"/g, '&quot;')}">${escHtml(String(v))}</td>`;
    }).join("");
    cells += `<td class="actions">
      <button class="small outline" onclick="openEdit(${realIdx})">Edit</button>
      <button class="small" data-variant="danger" onclick="confirmDelete(${realIdx})">Delete</button>
    </td>`;
    html += `<tr>${cells}</tr>`;
  }
  document.getElementById("tbody").innerHTML = html;
}

function escHtml(s) {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function fuzzyMatch(text, query) {
  const t = text.toLowerCase();
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  return terms.every(term => t.includes(term));
}

function highlightMatch(text, query) {
  const escaped = escHtml(text);
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return escaped;
  const lower = escaped.toLowerCase();
  const ranges = [];
  for (const term of terms) {
    let start = 0;
    while (true) {
      const idx = lower.indexOf(term, start);
      if (idx === -1) break;
      ranges.push([idx, idx + term.length]);
      start = idx + 1;
    }
  }
  if (!ranges.length) return escaped;
  ranges.sort((a, b) => a[0] - b[0]);
  const merged = [ranges[0]];
  for (let i = 1; i < ranges.length; i++) {
    const last = merged[merged.length - 1];
    if (ranges[i][0] <= last[1]) {
      last[1] = Math.max(last[1], ranges[i][1]);
    } else {
      merged.push(ranges[i]);
    }
  }
  let result = '', pos = 0;
  for (const [s, e] of merged) {
    result += escaped.slice(pos, s) + '<mark>' + escaped.slice(s, e) + '</mark>';
    pos = e;
  }
  return result + escaped.slice(pos);
}

function hideFkDropdown(id) {
  document.getElementById(id + '-list').style.display = 'none';
}

function showFkDropdown(id) {
  filterFkDropdown(id);
  document.getElementById(id + '-list').style.display = '';
}

function filterFkDropdown(id) {
  const input = document.getElementById(id);
  const list = document.getElementById(id + '-list');
  const q = input.value;
  let visibleCount = 0;
  for (const li of list.children) {
    li.classList.remove('active');
    const val = li.getAttribute('data-value');
    if (!q || fuzzyMatch(val, q)) {
      li.classList.remove('hidden');
      li.innerHTML = q ? highlightMatch(val, q) : escHtml(val);
      visibleCount++;
    } else {
      li.classList.add('hidden');
    }
  }
  list.style.display = visibleCount ? '' : 'none';
}

function getVisibleItems(id) {
  const list = document.getElementById(id + '-list');
  return Array.from(list.children).filter(li => !li.classList.contains('hidden'));
}

function fkKeydown(e, id) {
  const list = document.getElementById(id + '-list');
  if (list.style.display === 'none') return;
  const items = getVisibleItems(id);
  if (!items.length) return;
  const current = items.findIndex(li => li.classList.contains('active'));
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    const next = current < items.length - 1 ? current + 1 : 0;
    items.forEach(li => li.classList.remove('active'));
    items[next].classList.add('active');
    items[next].scrollIntoView({ block: 'nearest' });
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    const next = current > 0 ? current - 1 : items.length - 1;
    items.forEach(li => li.classList.remove('active'));
    items[next].classList.add('active');
    items[next].scrollIntoView({ block: 'nearest' });
  } else if (e.key === 'Enter') {
    if (current >= 0) {
      e.preventDefault();
      pickFk(id, items[current].getAttribute('data-value'));
    }
  }
}

function pickFk(id, value) {
  const input = document.getElementById(id);
  input.value = value;
  input.dispatchEvent(new Event('change'));
  document.getElementById(id + '-list').style.display = 'none';
}

document.addEventListener('mousedown', function(e) {
  const li = e.target.closest('.fk-dropdown li[data-fk]');
  if (li) {
    e.preventDefault();
    pickFk(li.getAttribute('data-fk'), li.getAttribute('data-value'));
    return;
  }
  document.querySelectorAll('.fk-dropdown').forEach(ul => {
    if (!ul.parentElement.contains(e.target)) ul.style.display = 'none';
  });
});

document.getElementById('modal').addEventListener('scroll', function() {
  document.querySelectorAll('.fk-dropdown').forEach(ul => { ul.style.display = 'none'; });
});

document.getElementById('modal').addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    const open = document.querySelectorAll('.fk-dropdown:not([style*="display: none"])');
    if (open.length) {
      e.stopPropagation();
      e.preventDefault();
      open.forEach(ul => { ul.style.display = 'none'; });
    }
  }
});

async function buildForm(row) {
  let html = "";
  for (const [field, spec] of Object.entries(tableSchema.fields)) {
    const val = row ? (row[field] ?? "") : "";
    const req = spec.required ? "required" : "";
    if (spec.type === "select") {
      html += `<div data-field><label>${field}${spec.required ? ' *' : ''}</label>`;
      html += `<select name="${field}" ${req}>`;
      if (!spec.required) html += `<option value="">--</option>`;
      for (const o of spec.options) {
        html += `<option value="${o}" ${val === o ? "selected" : ""}>${o}</option>`;
      }
      html += `</select></div>`;
    } else if (spec.type === "fk") {
      const opts = await loadFkOptions(spec.ref);
      const fkId = `fk-${field}`;
      html += `<div data-field><label>${field}${spec.required ? ' *' : ''}</label>`;
      html += `<div style="position:relative;">`;
      html += `<input type="text" name="${field}" id="${fkId}" value="${escHtml(String(val))}" ${req} autocomplete="off"
        onfocus="showFkDropdown('${fkId}')" oninput="filterFkDropdown('${fkId}')" onkeydown="fkKeydown(event, '${fkId}')" onblur="hideFkDropdown('${fkId}')">`;
      html += `<ul id="${fkId}-list" class="fk-dropdown" style="display:none;">`;
      for (const o of opts) {
        html += `<li data-value="${escHtml(o)}" data-fk="${fkId}">${escHtml(o)}</li>`;
      }
      html += `</ul></div></div>`;
    } else if (spec.type === "number") {
      html += `<label data-field>${field}${spec.required ? ' *' : ''}
        <input type="number" name="${field}" value="${val}" ${req}>
      </label>`;
    } else if (field.includes("description")) {
      html += `<label data-field>${field}${spec.required ? ' *' : ''}
        <textarea name="${field}" ${req}>${escHtml(String(val))}</textarea>
      </label>`;
    } else {
      const ro = spec.computed ? 'readonly disabled' : '';
      html += `<label data-field>${field}${spec.required ? ' *' : ''}
        <input type="text" name="${field}" value="${escHtml(String(val))}" ${req} ${ro}>
      </label>`;
    }
  }
  document.getElementById("form-fields").innerHTML = html;
  bindComputedFields();
}

function bindComputedFields() {
  for (const [field, spec] of Object.entries(tableSchema.fields)) {
    if (!spec.computed) continue;
    const target = document.querySelector(`[name="${field}"]`);
    if (!target) continue;
    const update = () => {
      const parts = spec.computed.map(src => {
        const el = document.querySelector(`[name="${src}"]`);
        return el ? el.value : '';
      });
      if (parts.every(p => p)) {
        target.value = parts.join('-');
      } else {
        target.value = '';
      }
    };
    for (const src of spec.computed) {
      const el = document.querySelector(`[name="${src}"]`);
      if (el) {
        el.addEventListener('input', update);
        el.addEventListener('change', update);
      }
    }
    update();
  }
}

function openCreate() {
  editIndex = null;
  document.getElementById("modal-title").textContent = "Add " + TABLE;
  document.getElementById("submit-btn").textContent = "Create";
  buildForm(null);
  document.getElementById("modal").showModal();
}

function openEdit(idx) {
  editIndex = idx;
  document.getElementById("modal-title").textContent = "Edit " + TABLE;
  document.getElementById("submit-btn").textContent = "Update";
  buildForm(rows[idx]);
  document.getElementById("modal").showModal();
}

function closeModal() {
  document.getElementById("modal").close();
}

async function handleSubmit(e) {
  e.preventDefault();
  document.querySelectorAll('#form [disabled]').forEach(el => { el.disabled = false; });
  const fd = new FormData(document.getElementById("form"));
  const row = {};
  for (const [field, spec] of Object.entries(tableSchema.fields)) {
    let v = fd.get(field);
    if (spec.type === "number" && v !== "" && v !== null) v = Number(v);
    row[field] = v;
  }
  const url = editIndex !== null ? `/api/${TABLE}/${editIndex}` : `/api/${TABLE}`;
  const method = editIndex !== null ? "PUT" : "POST";
  await fetch(url, { method, headers: {"Content-Type": "application/json"}, body: JSON.stringify(row) });
  closeModal();
  await loadData();
}

async function confirmDelete(idx) {
  const pk = tableSchema.pk;
  const label = pk ? rows[idx][pk] : `row #${idx}`;
  if (!confirm(`Delete "${label}"?`)) return;
  await fetch(`/api/${TABLE}/${idx}`, { method: "DELETE" });
  await loadData();
}

document.getElementById("search").addEventListener("input", render);

function toggleTheme() {
  const dark = document.getElementById("theme-toggle").checked;
  const theme = dark ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
}

(function() {
  var t = localStorage.getItem("theme") ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", t);
  if (t === "dark") document.getElementById("theme-toggle").checked = true;
})();

loadData();
