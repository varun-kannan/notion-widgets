import { weightView } from './model.js';

const $ = id => document.getElementById(id);
const keyName = 'notion-finance:view-key';
const colorName = 'notion-weight:colors';
const defaults = { background: '#191919', surface: '#22242a', text: '#f3f5ff', muted: '#a7aabc', border: '#393b4c', violet: '#aa74ff', blue: '#8bcfff' };
let accessKey = '';
let trackerData = null;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function setColors() {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(colorName) ?? '{}'); } catch { /* Defaults remain. */ }
  for (const [name, fallback] of Object.entries(defaults)) {
    const value = /^#[0-9a-f]{6}$/i.test(saved[name]) ? saved[name] : fallback;
    document.documentElement.style.setProperty(`--${name}`, value);
    $(`${name}-color`).value = value;
  }
}

function showGate(message = '') {
  $('gate').hidden = false;
  $('dashboard').hidden = true;
  $('refresh').hidden = true;
  $('sync-state').textContent = 'Locked';
  $('gate-error').textContent = message;
  $('rank').textContent = 'UNRANKED';
  $('xp-label').textContent = '0 logging XP';
  $('xp-fill').style.width = '0%';
}

function rankFor(entries) {
  if (entries >= 90) return 'S-RANK LOGGER';
  if (entries >= 30) return 'A-RANK LOGGER';
  if (entries >= 14) return 'B-RANK LOGGER';
  if (entries >= 7) return 'C-RANK LOGGER';
  if (entries >= 1) return 'D-RANK LOGGER';
  return 'UNRANKED';
}

function svg(tag, attrs = {}) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  return node;
}

function renderChart(rows) {
  const target = $('weight-chart');
  target.replaceChildren();
  if (!rows.length) {
    target.append(el('p', 'empty', 'No daily weigh-ins yet. Add a dated entry to begin the chart.'));
    target.setAttribute('aria-label', 'No daily weight entries');
    return;
  }
  const values = rows.map(row => row.weight);
  const min = Math.min(...values) - 1;
  const max = Math.max(...values) + 1;
  const width = 640;
  const height = 230;
  const left = 30;
  const right = 610;
  const top = 22;
  const bottom = 185;
  const points = rows.map((row, index) => ({
    x: rows.length === 1 ? (left + right) / 2 : left + index * (right - left) / (rows.length - 1),
    y: bottom - (row.weight - min) / (max - min) * (bottom - top),
    row,
  }));
  const graphic = svg('svg', { viewBox: `0 0 ${width} ${height}`, preserveAspectRatio: 'none', 'aria-hidden': 'true' });
  const defs = svg('defs');
  const gradient = svg('linearGradient', { id: 'weight-fill', x1: '0', y1: '0', x2: '0', y2: '1' });
  gradient.append(svg('stop', { offset: '0%', 'stop-color': 'var(--violet)', 'stop-opacity': '.38' }), svg('stop', { offset: '100%', 'stop-color': 'var(--violet)', 'stop-opacity': '0' }));
  defs.append(gradient); graphic.append(defs);
  for (let row = 0; row < 4; row++) {
    const y = top + row * (bottom - top) / 3;
    graphic.append(svg('line', { x1: left, x2: right, y1: y, y2: y, class: 'grid-line' }));
  }
  if (points.length > 1) {
    const path = points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
    graphic.append(svg('path', { d: `${path} L ${points.at(-1).x} ${bottom} L ${points[0].x} ${bottom} Z`, fill: 'url(#weight-fill)' }));
    graphic.append(svg('path', { d: path, class: 'trend-line', fill: 'none' }));
  }
  for (const point of points) {
    const dot = svg('circle', { cx: point.x, cy: point.y, r: 5, class: 'trend-dot' });
    dot.append(svg('title'));
    dot.firstChild.textContent = `${point.row.date}: ${point.row.weight} kg`;
    graphic.append(dot);
  }
  target.append(graphic);
  const labels = el('div', 'chart-labels');
  labels.append(el('span', '', rows[0].date), el('span', '', rows.at(-1).date));
  target.append(labels);
  target.setAttribute('aria-label', `${rows.length} weigh-ins from ${rows[0].date} to ${rows.at(-1).date}`);
}

function metricBar(name, actual, target, unit) {
  const row = el('div', 'macro-row');
  const head = el('div', 'macro-head');
  head.append(el('span', '', name), el('strong', '', `${actual ?? '--'} / ${target ?? '--'} ${unit}`));
  const track = el('div', 'macro-track');
  const fill = el('span');
  fill.style.width = `${actual != null && target > 0 ? Math.min(100, Math.max(0, actual / target * 100)) : 0}%`;
  track.append(fill);
  row.append(head, track);
  return row;
}

function renderNutrition(view) {
  const target = $('nutrition');
  target.replaceChildren();
  if (!view.latestDaily) {
    target.append(el('p', 'empty', 'Your Daily Tracker is empty. Add a dated entry in Notion to see calories and macros here.'));
    return;
  }
  const summary = el('div', 'fuel-summary');
  summary.append(el('small', '', `Latest daily log - ${view.latestDaily.date}`), el('strong', '', view.calories === null ? 'No meal totals' : `${view.calories.toLocaleString('en-IN')} kcal`));
  target.append(summary);
  target.append(metricBar('Calorie intake', view.calories, view.latestDaily.calorieTarget, 'kcal'));
  for (const macro of view.macros) target.append(metricBar(macro.name, macro.actual, macro.target, macro.unit));
  if (view.latestDaily.burned != null) target.append(el('p', 'burned', `Activity recorded: ${view.latestDaily.burned} kcal`));
}

function render() {
  if (!trackerData) return;
  const view = weightView(trackerData);
  $('baseline').textContent = view.baseline == null ? '--' : `${view.baseline} kg`;
  $('latest').textContent = view.latest ? `${view.latest.weight} kg` : '--';
  $('latest-date').textContent = view.latest?.date ?? 'No daily weigh-in yet';
  $('change').textContent = view.change == null ? '--' : `${view.change > 0 ? '+' : ''}${view.change.toFixed(1)} kg`;
  $('entries').textContent = String(view.daily.length);
  $('rank').textContent = rankFor(view.daily.length);
  $('xp-label').textContent = `${view.loggingXp} logging XP`;
  $('xp-fill').style.width = `${Math.min(100, view.daily.length % 7 / 7 * 100)}%`;
  $('scene-line').textContent = view.latest ? `Latest record - ${view.latest.weight} kg` : 'Each entry builds your story.';
  renderChart(view.weighIns);
  renderNutrition(view);
  $('data-note').textContent = `${view.undatedCount ? `${view.undatedCount} daily row(s) need a recognizable date title. ` : ''}Progress effects reward logging, not weight loss. Missing end weight is never treated as zero.`;
}

async function sync() {
  if (!accessKey) return showGate();
  $('sync-state').textContent = 'Syncing...';
  try {
    const response = await fetch('/.netlify/functions/notion-weight', { headers: { Authorization: `Bearer ${accessKey}` }, cache: 'no-store' });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || 'Sync failed');
    trackerData = body;
    $('gate').hidden = true;
    $('dashboard').hidden = false;
    $('refresh').hidden = false;
    $('gate-error').textContent = '';
    $('sync-state').textContent = `Synced ${new Date(body.syncedAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}`;
    render();
  } catch (error) {
    if (error.message === 'Invalid access key') {
      accessKey = '';
      trackerData = null;
      try { sessionStorage.removeItem(keyName); } catch { /* Storage may be unavailable in an embed. */ }
      showGate('That access key did not work.');
    } else {
      $('sync-state').textContent = 'Sync unavailable';
      if (!trackerData) showGate(`${error.message}. Check the deployment and Notion connection.`);
    }
  }
}

setColors();
try { accessKey = sessionStorage.getItem(keyName) ?? ''; } catch { /* Storage may be unavailable in an embed. */ }
if (accessKey) sync(); else showGate();
$('key-form').addEventListener('submit', event => {
  event.preventDefault();
  accessKey = $('view-key').value.trim();
  $('view-key').value = '';
  try { sessionStorage.setItem(keyName, accessKey); } catch { /* Keep the key in memory for this page. */ }
  sync();
});
$('refresh').addEventListener('click', sync);
$('appearance').addEventListener('click', () => $('color-dialog').showModal());
$('lock').addEventListener('click', () => {
  accessKey = '';
  trackerData = null;
  try { sessionStorage.removeItem(keyName); } catch { /* Storage may be unavailable in an embed. */ }
  $('color-dialog').close();
  showGate();
});
document.querySelectorAll('.color-list input').forEach(input => input.addEventListener('input', () => {
  const saved = Object.fromEntries([...document.querySelectorAll('.color-list input')].map(item => [item.id.replace('-color', ''), item.value]));
  for (const [name, value] of Object.entries(saved)) document.documentElement.style.setProperty(`--${name}`, value);
  try { localStorage.setItem(colorName, JSON.stringify(saved)); } catch { /* Defaults return next visit. */ }
}));

const scene = $('scene');
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  scene.addEventListener('pointermove', event => {
    const box = scene.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - .5;
    const y = (event.clientY - box.top) / box.height - .5;
    scene.style.setProperty('--turn-x', `${(-y * 8).toFixed(2)}deg`);
    scene.style.setProperty('--turn-y', `${(x * 8).toFixed(2)}deg`);
  });
  scene.addEventListener('pointerleave', () => { scene.style.setProperty('--turn-x', '0deg'); scene.style.setProperty('--turn-y', '0deg'); });
}
setInterval(() => { if (accessKey && !document.hidden) sync(); }, 60000);
