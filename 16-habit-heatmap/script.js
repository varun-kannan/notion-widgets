import { boot, el, fields, button, empty, localDay, shiftDay, dateLabel } from './core.js';
import { allHabits, heatCells, dataTable, sourceLink } from './viz.js';
import { editHabit, toggleHabit } from './habits.js';

let selected = localDay();
boot({ id: 'habit-heatmap', title: 'Habit heatmap', symbol: '\u25a6', defaults: { weeks: 13 }, configure: (r, c) => fields(r, c, [['weeks', 'Weeks to show', 'select', { options: [['13', '13 weeks'], ['26', '26 weeks'], ['52', '52 weeks']] }]]), render(app) {
  const r = app.root; r.replaceChildren(); const habits = allHabits(), today = localDay(), weeks = [13, 26, 52].includes(Number(app.config.weeks)) ? Number(app.config.weeks) : 13; const end = shiftDay(today, 6 - new Date().getDay()), cells = heatCells(habits, end, weeks); const recorded = cells.filter(v => v.date <= today);
  r.append(el('p', `${weeks} WEEKS OF SHOWING UP`, 'eyebrow'));
  if (!habits.length) empty(r, 'Every square is a chance', 'Add a daily habit to see your check-ins here.');
  else {
    const rate = Math.round(recorded.reduce((sum, item) => sum + item.complete, 0) / Math.max(1, recorded.length * habits.length) * 100); const lead = el('div', undefined, 'chart-lead'), intro = el('div'); intro.append(el('strong', rate + '%'), el('p', 'Overall check-in rate', 'muted')); lead.append(intro, el('span', habits.length + (habits.length === 1 ? ' habit' : ' habits'), 'tag')); r.append(lead);
    const panel = el('div', undefined, 'heatmap-panel chart-surface'); const labels = el('div', undefined, 'month-row'); for (let w = 0; w < weeks; w++) { const first = cells[w * 7].date; labels.append(el('span', w === 0 || first.endsWith('-01') || Number(first.slice(-2)) <= 7 ? new Intl.DateTimeFormat(undefined, { month: 'short' }).format(new Date(first + 'T12:00')) : '')); } panel.append(labels);
    const grid = el('div', undefined, 'heatmap-grid'); grid.style.setProperty('--weeks', weeks); cells.forEach(item => { const future = item.date > today, b = button('', () => { selected = item.date; app.redraw(); }, 'heat-cell' + (selected === item.date ? ' selected' : '')); b.disabled = future; b.style.setProperty('--strength', (item.percent * 85 + 10).toFixed(0) + '%'); b.setAttribute('aria-label', `${dateLabel(item.date, { year: 'numeric' })}: ${item.complete} of ${item.total} habits`); b.title = `${item.date}: ${item.complete}/${item.total}`; grid.append(b); }); panel.append(grid); r.append(panel);
    const legend = el('div', undefined, 'heat-legend'); legend.append(el('span', 'Less'), el('i', '', 'heat-cell'), el('i', '', 'heat-cell'), el('i', '', 'heat-cell'), el('span', 'More')); [legend.children[1], legend.children[2], legend.children[3]].forEach((n, i) => n.style.setProperty('--strength', (20 + i * 35) + '%')); r.append(legend);
    if (selected < cells[0].date || selected > today) selected = today; const day = el('div', undefined, 'selected-day'); day.append(el('h3', dateLabel(selected, { weekday: 'long', year: 'numeric' }))); habits.forEach(h => { const done = h.days.includes(selected); day.append(button((done ? '\u2713 ' : '\u25cb ') + h.name, () => toggleHabit(h.id, selected), done ? 'checked-day' : '')); }); r.append(day);
    r.append(dataTable(['Date', 'Completed', 'Total habits'], recorded.map(v => [v.date, v.complete, v.total])));
  }
  const actions = el('div', undefined, 'chart-actions'); actions.append(button('Add habit', () => editHabit(), 'primary'), sourceLink('Open habit summary', '11-habit-summary')); r.append(actions);
} });
