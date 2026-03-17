import Handlebars from 'handlebars';
import { registerMCNHelpers } from './mcn-helpers.js';
import { SAMPLES } from './samples.js';

// ── Register all MCN helpers ──────────────────
registerMCNHelpers(Handlebars);

// ── DOM refs ──────────────────────────────────
const templateEditor  = document.getElementById('templateEditor');
const dataEditor      = document.getElementById('dataEditor');
const outputFrame     = document.getElementById('outputFrame');
const errorConsole    = document.getElementById('errorConsole');
const sampleSelect    = document.getElementById('sampleSelect');
const dataFileSelect  = document.getElementById('dataFileSelect');
const reloadDataBtn   = document.getElementById('reloadDataBtn');
const clearConsole    = document.getElementById('clearConsole');
const refContent      = document.getElementById('refContent');
const refTabs         = document.querySelectorAll('.ref-tab');

// ── Load data files via Vite's import.meta.glob ──
// Eagerly import all JSON files from the data/ folder.
// Vite's HMR will hot-reload these when files change on disk.
const dataModules = import.meta.glob('../data/*.json', { eager: true });

// Build a map: filename stem → parsed JSON object
const dataFiles = {};
for (const [path, mod] of Object.entries(dataModules)) {
  const stem = path.replace(/^.*\//, '').replace(/\.json$/, '');
  dataFiles[stem] = mod.default ?? mod;
}

// ── Populate selects ──────────────────────────
function populateSampleSelect() {
  sampleSelect.innerHTML = '';          // clear before repopulating (HMR-safe)
  SAMPLES.forEach((s, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = s.name;
    sampleSelect.appendChild(opt);
  });
}

function populateDataFileSelect() {
  dataFileSelect.innerHTML = '';        // clear before repopulating (HMR-safe)
  Object.keys(dataFiles).sort().forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name + '.json';
    dataFileSelect.appendChild(opt);
  });
}

populateSampleSelect();
populateDataFileSelect();

// ── Rendering ────────────────────────────────
let renderTimer = null;

function render() {
  const template = templateEditor.value;
  const dataRaw  = dataEditor.value;

  if (!template.trim()) {
    setOutput('<p style="color:#888;font-family:sans-serif;padding:16px">Write a template to see output here.</p>');
    return;
  }

  let data;
  try {
    data = dataRaw.trim() ? JSON.parse(dataRaw) : {};
  } catch (e) {
    logError(`JSON parse error: ${e.message}`);
    return;
  }

  try {
    const compiled = Handlebars.compile(template);
    const html = compiled(data);
    setOutput(html);
    logOK('Rendered OK');
  } catch (e) {
    logError(`Template error: ${e.message}`);
    setOutput(`<pre style="color:red;padding:16px;font-size:12px">${escHtml(e.message)}</pre>`);
  }
}

function scheduleRender() {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(render, 280);
}

function setOutput(html) {
  // Wrap in basic page shell so the iframe renders properly
  const doc = `<!DOCTYPE html><html><head>
<meta charset="UTF-8">
<style>
  body { font-family: 'Segoe UI', system-ui, sans-serif; font-size: 14px;
         color: #222; padding: 16px; line-height: 1.6; }
  pre { background: #f5f5f5; padding: 10px; border-radius: 4px;
        overflow-x: auto; font-size: 12px; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
  th { background: #f0f0f0; }
</style>
</head><body>${html}</body></html>`;
  outputFrame.srcdoc = doc;
}

// ── Console logging ───────────────────────────
const MAX_LOG_LINES = 200;
let logCount = 0;

function log(msg, cls) {
  const line = document.createElement('div');
  line.className = cls;
  const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
  line.textContent = `[${ts}] ${msg}`;
  errorConsole.appendChild(line);
  errorConsole.scrollTop = errorConsole.scrollHeight;
  logCount++;
  if (logCount > MAX_LOG_LINES) {
    errorConsole.firstChild?.remove();
    logCount--;
  }
}

let lastOK = null;
function logOK(msg)    {
  // Deduplicate consecutive OK messages
  if (lastOK === msg) return;
  lastOK = msg;
  log(msg, 'log-ok');
}
function logError(msg) { lastOK = null; log(msg, 'log-error'); }
function logWarn(msg)  { log(msg, 'log-warn'); }
function logInfo(msg)  { log(msg, 'log-info'); }

clearConsole.addEventListener('click', () => {
  errorConsole.innerHTML = '';
  logCount = 0;
  lastOK = null;
});

// ── Sample / data file loading ────────────────
sampleSelect.addEventListener('change', () => {
  const idx = parseInt(sampleSelect.value);
  const sample = SAMPLES[idx];
  if (!sample || !sample.template) return;

  templateEditor.value = sample.template;

  // If the sample suggests a data file, switch to it
  if (sample.dataFile && dataFiles[sample.dataFile]) {
    dataFileSelect.value = sample.dataFile;
    loadDataFile(sample.dataFile);
  }

  render();
});

dataFileSelect.addEventListener('change', () => {
  loadDataFile(dataFileSelect.value);
  render();
});

reloadDataBtn.addEventListener('click', () => {
  loadDataFile(dataFileSelect.value);
  render();
  logInfo(`Reloaded ${dataFileSelect.value}.json`);
});

function loadDataFile(name) {
  const data = dataFiles[name];
  if (data) {
    dataEditor.value = JSON.stringify(data, null, 2);
  } else {
    logWarn(`Data file "${name}.json" not found in data/ folder`);
  }
}

// ── HMR: watch data file changes ─────────────
if (import.meta.hot) {
  import.meta.hot.accept(Object.keys(dataModules), (mods) => {
    // Refresh the dataFiles map when any data file changes
    for (const [path, mod] of Object.entries(dataModules)) {
      const stem = path.replace(/^.*\//, '').replace(/\.json$/, '');
      dataFiles[stem] = mod?.default ?? mod;
    }
    const current = dataFileSelect.value;
    if (dataFiles[current]) {
      loadDataFile(current);
      logInfo(`HMR: ${current}.json reloaded`);
      render();
    }
  });
}

// ── Editor events ────────────────────────────
templateEditor.addEventListener('input', scheduleRender);
dataEditor.addEventListener('input', scheduleRender);

// Tab key → insert 2 spaces in textareas
[templateEditor, dataEditor].forEach(ta => {
  ta.addEventListener('keydown', e => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = ta.selectionStart, end = ta.selectionEnd;
      ta.value = ta.value.slice(0, start) + '  ' + ta.value.slice(end);
      ta.selectionStart = ta.selectionEnd = start + 2;
    }
  });
});

// ── Reference bar ─────────────────────────────
const REF_DATA = {
  object: [
    { name: 'each',    syntax: '{{#each list}} ... {{/each}}',                          desc: 'Built-in. Iterate array/object. Provides @index, @key, @first, @last.' },
    { name: 'filter',  syntax: '{{filter list "field" "op" value "type"}}',             desc: 'Filter list. Operators: > < == != >= <= CONTAINS IS_NULL IS_NOT_NULL. Types: string number date.' },
    { name: 'flatten', syntax: '{{flatten nestedList}}',                                desc: 'Flatten a list-of-lists one level deep.' },
    { name: 'get',     syntax: '{{get collection indexOrKey}}',                         desc: 'Get item by index (0-based, arrays) or key (objects).' },
    { name: 'map',     syntax: '{{map list "fieldName"}}',                              desc: 'Extract a field from each object in a list. Skips missing fields.' },
    { name: 'slice',   syntax: '{{slice list startIndex [endIndex]}}',                  desc: 'Return portion of list. 0-indexed, negative indices supported. endIndex excluded.' },
  ],
  string: [
    { name: 'char',       syntax: '{{char code [repeated]}}',                           desc: 'Unicode char from decimal code. code % 65536 for out-of-range. Default repeat = 1.' },
    { name: 'concat',     syntax: '{{concat val1 val2 ...}}',                           desc: 'Concatenate values into a string. Nulls are skipped.' },
    { name: 'indexOf',    syntax: '{{indexOf subject search}}',                         desc: 'Return position of search in subject (0-based), or -1 if not found.' },
    { name: 'lowercase',  syntax: '{{lowercase subject [culture]}}',                    desc: 'Convert to lowercase. Optional culture code (e.g. tr-TR).' },
    { name: 'properCase', syntax: '{{properCase subject}}',                             desc: 'Capitalize first letter of each word.' },
    { name: 'replace',    syntax: '{{replace subject search replacement [culture]}}',   desc: 'Replace all occurrences (case-sensitive).' },
    { name: 'substring',  syntax: '{{substring subject start [length]}}',               desc: '⚠ 1-based start index. Returns chars from start; optional length.' },
    { name: 'trim',       syntax: '{{trim subject}}',                                   desc: 'Remove leading and trailing whitespace.' },
    { name: 'uppercase',  syntax: '{{uppercase subject [culture]}}',                    desc: 'Convert to uppercase. Optional culture code (e.g. tr-TR).' },
  ],
  datetime: [
    { name: 'now', syntax: '{{now}}',  desc: '⚠ Current time in CST (UTC-6, no DST). Format: M/D/YYYY h:mm:ss AM/PM -06:00.' },
  ],
  comparison: [
    { name: 'and',    syntax: '{{and val1 val2 ...}}',                                      desc: 'Logical AND. True if all values are truthy.' },
    { name: 'compare',syntax: '{{compare left "op" right}}',                          desc: 'Compare two values. Ops: > < >= <= == !=. Auto-detects null/bool/date/number/string.' },
    { name: 'equals', syntax: '{{equals v1 v2 [compareAs]}}',                           desc: 'Equality check. compareAs: string (default) | number | date | datetime.' },
    { name: 'if',     syntax: '{{#if cond}} ... {{else if c2}} ... {{else}} ... {{/if}}',desc: 'Built-in conditional. Supports else if chains.' },
    { name: 'iif',    syntax: '{{iif expr trueVal falseVal}}',                           desc: 'Ternary. ⚠ Both branches always evaluated.' },
    { name: 'isempty',syntax: '{{isempty val}}',                                         desc: 'True if null, empty string, or empty array.' },
    { name: 'isnull', syntax: '{{isnull val}}',                                          desc: 'True if null or undefined.' },
    { name: 'not',    syntax: '{{not val}}',                                            desc: 'Logical NOT.' },
    { name: 'or',     syntax: '{{or val1 val2 ...}}',                                    desc: 'Logical OR. True if any value is truthy.' },
    { name: 'unless', syntax: '{{#unless cond}} ... {{else}} ... {{/unless}}',           desc: 'Built-in. Renders block when condition is false.' },
  ],
  utility: [
    { name: 'fallback',       syntax: '{{fallback value fallbackValue}}',                desc: 'Return fallbackValue if value is null or empty string.' },
    { name: 'format',         syntax: '{{format subject "fmtStr" [type] [culture]}}',   desc: '⚠ Format date (type="date") or number (type="numeric"). .NET format strings.' },
    { name: 'formatCurrency', syntax: '{{formatCurrency number cultureCode}}',           desc: 'Format as currency. Currency derived from culture code (en-US → USD, en-GB → GBP, etc.).' },
    { name: 'formatNumber',   syntax: '{{formatNumber value [fmtStr] [culture]}}',      desc: '⚠ Format as number. Supports N, F, C, P, D, E, G specifiers.' },
    { name: 'length',         syntax: '{{length subject}}',                             desc: 'Character count (strings) or element count (arrays). 0 for null.' },
    { name: 'repeat',         syntax: '{{#repeat count}} ... {{/repeat}}',              desc: 'Repeat block N times. Provides @index, @first, @last.' },
    { name: 'set',            syntax: '{{#set key="val" key2=val2}} ... {{/set}}',      desc: 'Inject local variables into block context. Parent context preserved.' },
    { name: 'sort',           syntax: '{{sort list "field" "asc|desc" "type"}}',        desc: 'Sort list by field. Types: string number date boolean.' },
    { name: 'with',           syntax: '{{#with object}} ... {{/with}}',                 desc: 'Built-in. Switch context to object. Use @root to access root context.' },
  ],
  math: [
    { name: 'add',      syntax: '{{add value1 value2}}',           desc: 'Sum of two numbers. Result rounded to 2 decimal places. Throws if non-numeric.' },
    { name: 'subtract', syntax: '{{subtract value1 value2}}',      desc: 'Difference (value1 − value2). Result rounded to 2 decimal places.' },
    { name: 'multiply', syntax: '{{multiply value1 value2}}',      desc: 'Product of two numbers. Result rounded to 2 decimal places.' },
    { name: 'divide',   syntax: '{{divide dividend divisor}}',     desc: 'Quotient rounded to 2 decimal places. Throws on division by zero.' },
    { name: 'modulo',   syntax: '{{modulo value1 value2}}',        desc: 'Remainder (value1 % value2) rounded to 2 decimal places. Throws on division by zero.' },
    { name: 'Random',   syntax: '{{Random first second}}',         desc: '⚠ Random integer in [first, second] inclusive. second must be ≥ first.' },
  ],
  deviations: [],
};

const DEVIATIONS = [
  { title: 'now', detail: 'Uses browser clock adjusted to CST offset (−06:00). MCN uses the actual server CST clock.' },
  { title: 'format (date)', detail: '.NET format strings (yyyy, MM, dd, HH) are mapped best-effort. Some edge cases may differ.' },
  { title: 'format (numeric)', detail: 'Uses Intl.NumberFormat. Supports N, F, C, P, D, E, G specifiers. Custom # patterns partially supported.' },
  { title: 'culture params', detail: 'Passed to Intl APIs. .NET CultureInfo may produce different output for Turkic and some Asian locales.' },
  { title: 'compare (dates)', detail: 'Uses Date.parse(). .NET DateTime parser supports more formats (e.g. "9/29/2024 2:30:00 PM").' },
  { title: 'substring', detail: 'Uses 1-based start index per docs. Negative length returns rest of string (matches docs).' },
  { title: 'iif', detail: 'Both leftResult and rightResult are always evaluated (matches MCN docs behavior).' },
  { title: 'random', detail: 'Uses browser Math.random(). MCN uses server-side RNG — values will differ, but the range behavior (inclusive integer) matches the docs.' },
  { title: 'Math: rounding', detail: 'All arithmetic ops (add/subtract/multiply/divide/modulo) round to 2 decimal places per docs. JavaScript floating-point may introduce sub-cent differences vs .NET Decimal.' },
  { title: 'formatCurrency: currency derivation', detail: 'Derives currency from culture code (en-US → USD, en-GB → GBP, etc.) via lookup table. Some locales may not have a standard currency.' },
];

function renderRefContent(cat) {
  refContent.innerHTML = '';
  if (cat === 'deviations') {
    DEVIATIONS.forEach(d => {
      const el = document.createElement('div');
      el.className = 'ref-deviation';
      el.innerHTML = `<strong>⚠ ${escHtml(d.title)}</strong> — ${escHtml(d.detail)}`;
      refContent.appendChild(el);
    });
    return;
  }
  (REF_DATA[cat] || []).forEach(entry => {
    const el = document.createElement('div');
    el.className = 'ref-entry';
    const nameEl = document.createElement('span');
    nameEl.className = 'ref-name';
    nameEl.textContent = entry.name;
    nameEl.title = 'Click to insert into template';
    nameEl.addEventListener('click', () => insertHelper(entry.name, entry.syntax));

    const synEl = document.createElement('div');
    synEl.className = 'ref-syntax';
    synEl.textContent = entry.syntax;

    const descEl = document.createElement('div');
    descEl.className = 'ref-desc';
    descEl.textContent = entry.desc;

    el.appendChild(nameEl);
    el.appendChild(synEl);
    el.appendChild(descEl);
    refContent.appendChild(el);
  });
}

function insertHelper(name, syntax) {
  // Insert a simple usage snippet at the cursor in the template editor
  const snip = syntax.split('\n')[0]; // first line of syntax
  const start = templateEditor.selectionStart;
  const val = templateEditor.value;
  templateEditor.value = val.slice(0, start) + snip + val.slice(start);
  templateEditor.selectionStart = templateEditor.selectionEnd = start + snip.length;
  templateEditor.focus();
  scheduleRender();
}

refTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    refTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    renderRefContent(tab.dataset.cat);
  });
});

// ── Reference bar toggle ──────────────────────
const refBar    = document.getElementById('refBar');
const refToggle = document.getElementById('refToggle');
refToggle.addEventListener('click', () => {
  const collapsed = refBar.classList.toggle('collapsed');
  refToggle.textContent = collapsed ? '▲ Show' : '▼ Hide';
  refToggle.title = collapsed ? 'Expand reference panel' : 'Collapse reference panel';
});

// ── Drag-to-resize panels ─────────────────────
function makeSplitter(divider, leftEl, isVertical) {
  let dragging = false, startPos = 0, startSize = 0;

  divider.addEventListener('mousedown', e => {
    dragging = true;
    divider.classList.add('dragging');
    startPos = isVertical ? e.clientX : e.clientY;
    startSize = isVertical ? leftEl.offsetWidth : leftEl.offsetHeight;
    e.preventDefault();
  });

  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    const delta = isVertical ? e.clientX - startPos : e.clientY - startPos;
    const newSize = startSize + delta;
    if (isVertical) {
      const total = divider.parentElement.offsetWidth;
      const pct = Math.max(15, Math.min(85, (newSize / total) * 100));
      leftEl.style.width = pct + '%';
    } else {
      const total = leftEl.parentElement.offsetHeight;
      const pct = Math.max(15, Math.min(85, (newSize / total) * 100));
      leftEl.style.flex = 'none';
      leftEl.style.height = pct + '%';
    }
  });

  document.addEventListener('mouseup', () => {
    if (dragging) { dragging = false; divider.classList.remove('dragging'); }
  });
}

makeSplitter(document.getElementById('vDivider'), document.querySelector('.panel-left'), true);
makeSplitter(document.getElementById('hDivider'), document.querySelector('.pane-template'), false);

// ── Escape HTML for console output ───────────
function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Init ──────────────────────────────────────
renderRefContent('object');

// Load first data file
const firstFile = Object.keys(dataFiles).sort()[0];
if (firstFile) {
  dataFileSelect.value = firstFile;
  loadDataFile(firstFile);
}

// Load first real sample
sampleSelect.value = 1;
const firstSample = SAMPLES[1];
if (firstSample) {
  templateEditor.value = firstSample.template;
  if (firstSample.dataFile && dataFiles[firstSample.dataFile]) {
    dataFileSelect.value = firstSample.dataFile;
    loadDataFile(firstSample.dataFile);
  }
}

logInfo('MCN Handlebars Playground ready. Edit data files in data/ folder — HMR auto-reloads them.');
render();
