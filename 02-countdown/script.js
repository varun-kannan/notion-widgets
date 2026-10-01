import { boot, fields, el, metric, progress, button, dialog, field, submit } from './core.js';
function chooseDays(app) { dialog('Days from today', (f, close) => { const days = field('Days', 30, 'number', { min: 1, max: 36500, required: true }); f.append(days); submit(f, 'Set date', () => { const d = new Date(); d.setDate(d.getDate() + Number(days.value())); const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); app.setConfig({ target: local }); close(); }); }); }
const app = boot({ id: 'countdown', title: 'Countdown', symbol: '\u25f4', defaults: { label: 'Next chapter', target: '', start: '', mode: 'remaining', showSeconds: false }, configure: (root, cfg) => fields(root, cfg, [['label', 'Countdown label'], ['target', 'Target date and time (your device timezone)', 'datetime-local'], ['start', 'Start date for progress (optional)', 'datetime-local'], ['mode', 'After target date', 'select', { options: [['remaining', 'Count days since'], ['stop', 'Show completed']] }], ['showSeconds', 'Show seconds', 'checkbox']]), render(app) {
  const { root, config: c } = app; root.replaceChildren(); root.append(el('p', c.label, 'eyebrow'));
  const end = Date.parse(c.target); if (!Number.isFinite(end)) { root.append(el('div', '--', 'hero-number'), el('p', 'Set your target in Settings.', 'muted'), button('Set a number of days', () => chooseDays(app), 'primary')); return; }
  const diff = end - Date.now(), seconds = Math.floor(Math.abs(diff) / 1000), passed = diff <= 0;
  if (passed && c.mode === 'stop') { root.append(el('h2', 'You made it.'), el('p', 'Target reached', 'accent')); return; }
  root.append(el('div', String(Math.floor(seconds / 86400)), 'hero-number'), el('p', passed ? 'DAYS SINCE' : 'DAYS REMAINING', 'eyebrow'));
  const row = el('div', undefined, 'grid'); metric(row, String(Math.floor(seconds % 86400 / 3600)).padStart(2, '0'), 'hours'); metric(row, String(Math.floor(seconds % 3600 / 60)).padStart(2, '0'), 'minutes'); if (c.showSeconds) metric(row, String(seconds % 60).padStart(2, '0'), 'seconds'); root.append(row);
  root.append(el('p', new Date(end).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }), 'muted small'));
  const start = Date.parse(c.start); if (Number.isFinite(start) && start < end) { const pct = Math.max(0, Math.min(100, (Date.now() - start) / (end - start) * 100)); root.append(progress(pct, 'Countdown progress'), el('p', Math.round(pct) + '% of the journey complete', 'muted small')); }
  root.append(button('Set a number of days from today', () => chooseDays(app), 'quiet'));
} });
setInterval(() => { if (!document.hidden) app.redraw(); }, 1000);
