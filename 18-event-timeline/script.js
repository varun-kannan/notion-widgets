import { boot, el, fields, button, empty, localDay, shiftDay, dateLabel } from './core.js';
import { allEvents, dataTable, sourceLink } from './viz.js';
import { sortedEvents } from './logic.js';
import { editEvent } from './events.js';

boot({ id: 'event-timeline', title: 'Event timeline', symbol: '\u2502', defaults: { days: 60, limit: 12, category: '' }, configure: (r, c) => fields(r, c, [['days', 'Look ahead (days)', 'number', { min: 1, max: 366 }], ['limit', 'Events to show', 'number', { min: 1, max: 100 }], ['category', 'Category filter (blank shows all)']]), render(app) {
  const r = app.root; r.replaceChildren(); const today = localDay(), days = Math.max(1, Math.min(366, Number(app.config.days) || 60)), limit = Math.max(1, Math.min(100, Number(app.config.limit) || 12)); const all = sortedEvents(allEvents(), today, shiftDay(today, days)).filter(item => !app.config.category || item.category.toLowerCase() === app.config.category.toLowerCase()); r.append(el('p', `THE NEXT ${days} DAYS`, 'eyebrow'));
  if (!all.length) empty(r, 'Your timeline is open', 'Add an event to map out what is coming.');
  else {
    const lead = el('div', undefined, 'chart-lead'), text = el('div'); text.append(el('strong', String(all.length)), el('p', all.length === 1 ? 'Upcoming event' : 'Upcoming events', 'muted')); lead.append(text); r.append(lead);
    const line = el('ol', undefined, 'timeline'); all.slice(0, limit).forEach((event, i) => { const item = el('li', undefined, 'timeline-event'); item.style.setProperty('--delay', i * 65 + 'ms'); const day = el('div', undefined, 'timeline-date'); day.append(el('strong', dateLabel(event.date, { weekday: 'short' })), el('span', event.time || 'All day')); const card = el('div', undefined, 'timeline-card'); card.append(el('h3', event.title)); if (event.category) card.append(el('span', event.category, 'tag')); if (event.notes) card.append(el('p', event.notes, 'small muted')); card.append(button('Edit event', () => editEvent(event), 'quiet')); item.append(day, card); line.append(item); }); r.append(line); if (all.length > limit) r.append(el('p', `${all.length - limit} more events within this period`, 'muted small')); r.append(dataTable(['Date', 'Time', 'Event', 'Category'], all.map(e => [e.date, e.time || 'All day', e.title, e.category || '-'])));
  }
  const actions = el('div', undefined, 'chart-actions'); actions.append(button('Add event', () => editEvent(), 'primary'), sourceLink('Open calendar', '05-calendar')); r.append(actions);
} });
