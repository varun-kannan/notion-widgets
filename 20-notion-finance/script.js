import { financeView, monthFromName } from './model.js';

const $ = id => document.getElementById(id);
const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const colors = ['--chart-1', '--chart-2', '--chart-3', '--chart-4'];
const keyName = 'notion-finance:view-key';
const colorName = 'notion-finance:colors';
const today = new Date();
const initialDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
let accessKey = '';
let financeData = null;
let period = 'month';
let selectedOnce = false;

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function setColors() {
  const fallback = { background: '#191b1a', surface: '#222725', accent: '#b9cfb7', text: '#f3f5f1', muted: '#a6b1a8', line: '#354039', warm: '#d7ad8f', 'chart-1': '#b9cfb7', 'chart-2': '#91aeca', 'chart-3': '#d0ad88', 'chart-4': '#baa1c5' };
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(colorName) ?? '{}'); } catch { /* Use defaults. */ }
  for (const [name, value] of Object.entries(fallback)) {
    const color = /^#[0-9a-f]{6}$/i.test(saved[name]) ? saved[name] : value;
    document.documentElement.style.setProperty(`--${name}`, color);
    $(`${name}-color`).value = color;
  }
}

function showGate(message = '') {
  $('gate').hidden = false;
  $('dashboard').hidden = true;
  $('refresh').hidden = true;
  $('sync-state').textContent = 'Locked';
  $('gate-error').textContent = message;
}

function renderTrend(rows) {
  const target = $('trend');
  target.replaceChildren();
  const max = Math.max(1, ...rows.flatMap(row => [row.income, row.expenses]));
  for (const row of rows) {
    const group = element('div', 'month-group');
    const columns = element('div', 'columns');
    for (const [type, amount] of [['income', row.income], ['expenses', row.expenses]]) {
      const bar = element('div', `bar ${type}`);
      bar.style.height = `${Math.max(amount > 0 ? 3 : 0, amount / max * 100)}%`;
      bar.title = `${type === 'income' ? 'Income' : 'Spent'}: ${currency.format(amount)}`;
      columns.append(bar);
    }
    group.append(columns, element('span', 'month-label', new Date(`${row.month}-02`).toLocaleDateString('en-IN', { month: 'short' })));
    target.append(group);
  }
  $('trend-caption').textContent = 'Last 6 months';
}

function renderDonut(rows, total) {
  $('donut-total').textContent = currency.format(total);
  const target = $('legend');
  target.replaceChildren();
  if (!total) {
    $('donut').style.background = 'conic-gradient(var(--surface) 0 100%)';
    target.append(element('p', 'empty', 'No spending recorded for this period.'));
    return;
  }
  let cursor = 0;
  const segments = [];
  rows.forEach((row, index) => {
    const next = cursor + Math.max(0, row.amount) / total * 100;
    const color = getComputedStyle(document.documentElement).getPropertyValue(colors[index % colors.length]).trim();
    segments.push(`${color} ${cursor}% ${next}%`);
    cursor = next;
    const item = element('div', 'legend-item');
    const dot = element('i');
    dot.style.background = color;
    item.append(dot, element('span', '', row.name), element('strong', '', currency.format(row.amount)));
    target.append(item);
  });
  $('donut').style.background = `conic-gradient(${segments.join(',')})`;
}

function renderBudgets(rows) {
  const target = $('budgets');
  target.replaceChildren();
  if (!rows.length) {
    target.append(element('p', 'empty', 'No budgets for the selected month.'));
    return;
  }
  for (const row of rows) {
    const item = element('div', 'budget-row');
    const head = element('div', 'budget-head');
    head.append(element('span', '', row.name), element('strong', '', `${currency.format(row.spent)} / ${currency.format(row.amount)}`));
    const track = element('div', 'track');
    const fill = element('span', row.spent > row.amount ? 'over' : '');
    fill.style.width = `${row.amount ? Math.min(100, Math.max(0, row.spent / row.amount * 100)) : 0}%`;
    track.append(fill);
    item.append(head, track);
    target.append(item);
  }
}

function renderActivity(rows) {
  const target = $('activity');
  target.replaceChildren();
  if (!rows.length) {
    target.append(element('p', 'empty', 'No income or expense entries for this period.'));
    return;
  }
  for (const row of rows) {
    const item = element('div', 'activity-row');
    const detail = element('div');
    detail.append(element('strong', '', row.name || (row.type === 'income' ? 'Income' : 'Expense')),
      element('small', '', row.date?.slice(0, 10) ?? 'No date'));
    item.append(detail, element('b', row.type, `${row.type === 'income' ? '+' : '-'}${currency.format(row.amount ?? 0)}`));
    target.append(item);
  }
}

function render() {
  if (!financeData) return;
  const date = $('period-date').value;
  const view = financeView(financeData, period, date);
  $('balance').textContent = currency.format(view.income - view.expenses);
  $('income').textContent = currency.format(view.income);
  $('spent').textContent = currency.format(view.expenses);
  $('credit').textContent = currency.format(view.credit);
  $('period-label').textContent = period === 'day' ? new Date(`${date}T12:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : period === 'year' ? date.slice(0, 4) : new Date(`${date.slice(0, 7)}-02`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  renderTrend(view.trendMonths);
  renderDonut(view.categories, view.expenses);
  renderBudgets(view.budgets);
  renderActivity(view.activity);
  $('data-note').textContent = `${view.undated ? `${view.undated} record(s) have no date; daily totals may omit them. ` : ''}Budgets show the selected month's progress. Credit card entries are separate because some may also be in Expenses.`;
}

async function sync() {
  if (!accessKey) return showGate();
  $('sync-state').textContent = 'Syncing...';
  try {
    const response = await fetch('/.netlify/functions/notion-finance', {
      headers: { Authorization: `Bearer ${accessKey}` },
      cache: 'no-store',
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || 'Sync failed');
    financeData = body;
    if (!selectedOnce) {
      const latestMonth = body.months.map(row => monthFromName(row.name)).filter(Boolean).sort().at(-1);
      if (latestMonth && latestMonth !== initialDate.slice(0, 7)) $('period-date').value = `${latestMonth}-01`;
      selectedOnce = true;
    }
    $('gate').hidden = true;
    $('dashboard').hidden = false;
    $('refresh').hidden = false;
    $('gate-error').textContent = '';
    $('sync-state').textContent = `Synced ${new Date(body.syncedAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}`;
    render();
  } catch (error) {
    if (error.message === 'Invalid access key') {
      accessKey = '';
      try { sessionStorage.removeItem(keyName); } catch { /* Storage may be unavailable in an embed. */ }
      showGate('That access key did not work.');
    } else {
      $('sync-state').textContent = 'Sync unavailable';
      if (!financeData) showGate(`${error.message}. Check the deployment and Notion connection.`);
    }
  }
}

$('period-date').value = initialDate;
setColors();
try { accessKey = sessionStorage.getItem(keyName) ?? ''; } catch { /* Storage may be unavailable in an embed. */ }
if (accessKey) sync();
else showGate();
$('key-form').addEventListener('submit', event => {
  event.preventDefault();
  accessKey = $('view-key').value.trim();
  $('view-key').value = '';
  try { sessionStorage.setItem(keyName, accessKey); } catch { /* Keep the key in memory for this page. */ }
  sync();
});
$('refresh').addEventListener('click', sync);
$('period-date').addEventListener('change', render);
document.querySelectorAll('[data-period]').forEach(button => button.addEventListener('click', () => {
  period = button.dataset.period;
  document.querySelectorAll('[data-period]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  render();
}));
$('settings').addEventListener('click', () => $('appearance').showModal());
$('lock').addEventListener('click', () => {
  accessKey = '';
  financeData = null;
  try { sessionStorage.removeItem(keyName); } catch { /* Storage may be unavailable in an embed. */ }
  $('appearance').close();
  showGate();
});
document.querySelectorAll('.colors input').forEach(input => input.addEventListener('input', () => {
  const saved = Object.fromEntries([...document.querySelectorAll('.colors input')].map(item => [item.id.replace('-color', ''), item.value]));
  for (const [name, value] of Object.entries(saved)) document.documentElement.style.setProperty(`--${name}`, value);
  try { localStorage.setItem(colorName, JSON.stringify(saved)); } catch { /* Colors use defaults next visit. */ }
  render();
}));
setInterval(() => { if (accessKey && !document.hidden) sync(); }, 60000);
