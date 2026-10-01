import { boot, el, button, fields, localDay, dayDate, dateLabel, empty } from './core.js';
import { events, editEvent, eventRow, eventBackup } from './events.js';
let selected = localDay(), month = selected.slice(0, 7);
boot({ id: 'calendar', title: 'Calendar', symbol: '\u25a6', defaults: { monday: true }, configure: (root, cfg) => fields(root, cfg, [['monday', 'Start week on Monday', 'checkbox']]), render(app) {
  const root = app.root; root.replaceChildren(); const first = dayDate(month + '-01');
  const head = el('div', undefined, 'actions'); const move = n => { first.setMonth(first.getMonth() + n); month = localDay(first).slice(0, 7); selected = month + '-01'; app.redraw(); };
  head.append(button('Previous', () => move(-1)), el('h2', dateLabel(month + '-01', { month: 'long', year: 'numeric', day: undefined }), 'grow'), button('Next', () => move(1))); root.append(head);
  const grid = el('div', undefined, 'calendar-grid'); const names = app.config.monday ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'] : ['S', 'M', 'T', 'W', 'T', 'F', 'S']; names.forEach(n => grid.append(el('span', n, 'weekday')));
  const start = (first.getDay() + (app.config.monday ? 6 : 0)) % 7; for (let i = 0; i < start; i++) grid.append(el('span'));
  const count = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate(); const all = events();
  for (let n = 1; n <= count; n++) { const d = month + '-' + String(n).padStart(2, '0'); const amount = all.filter(e => e.date === d).length; const b = button(String(n), () => { selected = d; app.redraw(); }, 'day' + (d === selected ? ' selected' : '') + (d === localDay() ? ' today' : '')); b.setAttribute('aria-label', `${dateLabel(d, { year: 'numeric' })}, ${amount} events`); b.setAttribute('aria-pressed', d === selected); if (amount) b.append(el('i', '', 'event-dot')); grid.append(b); } root.append(grid);
  const controls = el('div', undefined, 'actions'); controls.append(button('Today', () => { selected = localDay(); month = selected.slice(0, 7); app.redraw(); }), button('Add event', () => editEvent(null, selected), 'primary')); root.append(controls, el('h3', dateLabel(selected, { weekday: 'long' })));
  const rows = all.filter(e => e.date === selected).sort((a, b) => a.time.localeCompare(b.time)); if (!rows.length) empty(root, 'A little breathing room', 'No events on this date.'); rows.forEach(e => root.append(eventRow(e))); eventBackup(root);
} });
