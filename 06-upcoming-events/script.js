import { boot, el, button, fields, localDay, shiftDay, empty } from './core.js';
import { events, editEvent, eventRow, eventBackup } from './events.js';
import { sortedEvents } from './logic.js';
boot({ id: 'upcoming', title: 'Upcoming events', symbol: '\u2197', defaults: { days: 30, limit: 6, category: '' }, configure: (r, c) => fields(r, c, [['days', 'Look ahead (days)', 'number', { min: 1, max: 366 }], ['limit', 'Events to show', 'number', { min: 1, max: 50 }], ['category', 'Category filter (blank shows all)']]), render(app) {
  const r = app.root, c = app.config; r.replaceChildren(); const days = Math.max(1, Math.min(366, c.days)); const today = localDay(); const all = sortedEvents(events(), today, shiftDay(today, days)).filter(v => !c.category || v.category.toLowerCase() === c.category.toLowerCase());
  r.append(el('p', `Today + the next ${days} days`, 'eyebrow')); if (!all.length) empty(r, 'Your next chapter is open', 'Add an event here or in the Calendar widget.'); all.slice(0, Math.max(1, Math.min(50, c.limit))).forEach(v => r.append(eventRow(v))); if (all.length > c.limit) r.append(el('p', `${all.length - c.limit} more events in Calendar`, 'muted small')); r.append(button('Add event', () => editEvent(), 'primary')); eventBackup(r);
} });
