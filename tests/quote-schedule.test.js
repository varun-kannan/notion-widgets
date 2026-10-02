import test from 'node:test';
import assert from 'node:assert/strict';
import { activeBackground } from '../03-quote/schedule.js';

const schedule = [
  { id: 'evening', start: '18:00', image: 'evening.gif' },
  { id: 'morning', start: '06:00', image: 'morning.gif' },
];

test('quote backgrounds change at their local start time and wrap overnight', () => {
  assert.equal(activeBackground(schedule, new Date(2026, 9, 1, 5, 59)).id, 'evening');
  assert.equal(activeBackground(schedule, new Date(2026, 9, 1, 6, 0)).id, 'morning');
  assert.equal(activeBackground(schedule, new Date(2026, 9, 1, 18, 0)).id, 'evening');
  assert.equal(activeBackground(schedule, new Date(2026, 9, 1, 23, 59)).id, 'evening');
});

test('invalid schedule entries are ignored', () => {
  assert.equal(activeBackground([{ start: '25:00' }]), null);
  assert.equal(activeBackground(null), null);
});
