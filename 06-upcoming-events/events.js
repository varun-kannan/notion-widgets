import { read, save, uid, dialog, field, submit, el, button, confirmDelete, datasetTools, dateLabel, localDay } from './core.js';
import { validEvents } from './logic.js';
export function events() { const data = read('events', []); return validEvents(data) ? data : []; }
export function editEvent(item, selected = localDay()) {
  dialog(item ? 'Edit event' : 'New event', (f, close) => {
    const title = field('Event title', item?.title || '', 'text', { required: true, maxlength: 120 });
    const date = field('Date', item?.date || selected, 'date', { required: true });
    const time = field('Time (leave empty for all-day)', item?.time || '', 'time');
    const category = field('Category', item?.category || '', 'text', { maxlength: 50 });
    const notes = field('Notes', item?.notes || '', 'textarea', { maxlength: 1000 }); f.append(title, date, time, category, notes);
    submit(f, 'Save event', () => { const record = { id: item?.id || uid(), title: title.value().trim(), date: date.value(), time: time.value(), category: category.value().trim(), notes: notes.value() }; if (!validEvents([record])) throw Error('Enter a title and valid date.'); const rows = events().filter(v => v.id !== record.id); rows.push(record); save('events', rows); close(); });
  });
}
export function eventRow(item) {
  const row = el('article', undefined, 'record'); const content = el('div', undefined, 'grow'); content.append(el('strong', item.title), el('p', `${dateLabel(item.date)} / ${item.time || 'All day'}${item.category ? ' / ' + item.category : ''}`, 'muted small')); if (item.notes) content.append(el('p', item.notes, 'small')); row.append(content, button('Edit', () => editEvent(item), 'quiet'), button('Delete', () => confirmDelete(item.title, () => save('events', events().filter(v => v.id !== item.id))), 'quiet')); return row;
}
export function eventBackup(root) { datasetTools(root, 'events', events, validEvents, v => save('events', v)); }
