import { boot, el, fields, button, empty, localDay } from './core.js';
import { chart, svg, monthRange, monthLabel, transactions, money, moneyRows, dataTable, addTransaction, sourceLink } from './viz.js';

const modeNames = { net: 'Monthly net', income: 'Income', expense: 'Spending' };
boot({ id: 'finance-trend', title: 'Finance trend', symbol: '\u223f', defaults: { months: 6, mode: 'net' }, configure: (r, c) => fields(r, c, [['months', 'Months', 'select', { options: [['3', '3'], ['6', '6'], ['12', '12']] }], ['mode', 'Graph value', 'select', { options: [['net', 'Monthly net'], ['income', 'Income'], ['expense', 'Spending']] }]]), render(app) {
  const r = app.root; r.replaceChildren(); const records = transactions(); const count = [3, 6, 12].includes(Number(app.config.months)) ? Number(app.config.months) : 6; const mode = modeNames[app.config.mode] ? app.config.mode : 'net';
  const months = monthRange(count), rows = moneyRows(records, months), values = rows.map(v => v[mode]);
  if (!rows.some(v => v.rows.length)) empty(r, 'No records in this period', 'Add a transaction or choose a longer period in Settings.');
  else {
    const lead = el('div', undefined, 'chart-lead'), intro = el('div'); intro.append(el('p', modeNames[mode] + ' / ' + count + ' months', 'eyebrow'), el('strong', money(values.at(-1)))); lead.append(intro, el('span', mode === 'net' ? 'Income minus spending' : modeNames[mode], 'tag')); r.append(lead);
    const view = chart(`${modeNames[mode]} for the last ${count} months`), w = 600, h = 260, left = 58, right = 16, top = 22, bottom = 38; const min = Math.min(0, ...values), max = Math.max(0, ...values); const span = max - min || 1;
    const x = i => left + i * (w - left - right) / Math.max(1, values.length - 1), y = n => top + (max - n) / span * (h - top - bottom);
    for (let i = 0; i < 4; i++) { const v = min + span * i / 3; const yy = y(v); view.append(svg('line', { x1: left, y1: yy, x2: w - right, y2: yy, class: 'chart-grid' }), svg('text', { x: left - 8, y: yy + 4, 'text-anchor': 'end', class: 'chart-axis' }, money(v, true))); }
    const points = values.map((v, i) => [x(i), y(v)]), baseline = y(0); const first = points[0], last = points.at(-1); const line = points.map(([px, py], i) => `${i ? 'L' : 'M'}${px},${py}`).join(' '); const area = `${line} L${last[0]},${baseline} L${first[0]},${baseline} Z`;
    view.append(svg('path', { d: area, fill: 'var(--primary)', opacity: '.13' }), svg('path', { d: line, class: 'chart-line', pathLength: 100 }));
    points.forEach(([px, py], i) => { const dot = svg('circle', { cx: px, cy: py, r: 5, class: 'chart-dot' }); dot.append(svg('title', {}, `${monthLabel(months[i])}: ${money(values[i])}`)); view.append(dot, svg('text', { x: px, y: h - 10, 'text-anchor': 'middle', class: 'chart-axis' }, monthLabel(months[i]))); });
    const surface = el('div', undefined, 'chart-surface'); surface.append(view); r.append(surface, dataTable(['Month', 'Income', 'Spending', 'Net'], rows.map(v => [monthLabel(v.month), money(v.income), money(v.expense), money(v.net)])));
  }
  const actions = el('div', undefined, 'chart-actions'); actions.append(button('Add transaction', addTransaction, 'primary'), sourceLink('Open finance summary', '10-finance-summary')); r.append(actions);
} });
