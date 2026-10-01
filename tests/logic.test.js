import test from 'node:test';
import assert from 'node:assert/strict';
import { validDate, offset, streak, bestStreak, totals, validEvents, sortedEvents, validHabits, validTransactions, validFocus, validLinks, validSkin } from '../05-calendar/logic.js';

test('dates reject rollover and support leap years', () => {
  assert.equal(validDate('2026-02-29'), false);
  assert.equal(validDate('2024-02-29'), true);
  assert.equal(validDate('2026-13-01'), false);
  assert.equal(offset('2026-01-01', -1), '2025-12-31');
  assert.equal(offset('2024-02-28', 1), '2024-02-29');
});
test('streak allows today to remain unfinished, but not yesterday', () => {
  assert.equal(streak(['2026-09-28', '2026-09-29'], '2026-09-30'), 2);
  assert.equal(streak(['2026-09-28'], '2026-09-30'), 0);
  assert.equal(streak(['2026-09-29', '2026-09-30'], '2026-09-30'), 2);
  assert.equal(streak([], '2026-09-30'), 0);
  assert.equal(bestStreak(['2026-09-28', '2026-09-28', '2026-09-29', '2026-10-01']), 2);
});
test('events validate and sort all-day before timed events', () => {
  const a = { id: 'a', title: 'Read', date: '2026-10-01', time: '', category: '', notes: '' };
  const b = { ...a, id: 'b', time: '10:30' };
  assert.equal(validEvents([a, b]), true);
  assert.equal(validEvents([{ ...a, time: '25:00' }]), false);
  assert.equal(validEvents([a, a]), false);
  assert.deepEqual(sortedEvents([b, a], '2026-10-01').map(v => v.id), ['a', 'b']);
  assert.equal(sortedEvents([a], '2026-10-02').length, 0);
});
test('finances use only the chosen month and require positive finite amounts', () => {
  const a = { id: 'a', label: 'Pay', date: '2026-10-01', amount: 100, type: 'income', category: 'Work' };
  const b = { ...a, id: 'b', type: 'expense', amount: 30 };
  const c = { ...b, id: 'c', date: '2026-09-01' };
  assert.equal(validTransactions([a, b, c]), true);
  assert.equal(validTransactions([{ ...a, amount: -1 }]), false);
  assert.equal(validTransactions([{ ...a, amount: Infinity }]), false);
  assert.equal(totals([a, b, c], '2026-10').net, 70);
});
test('habit and focus backups reject malformed records', () => {
  assert.equal(validHabits([{ id: 'h', name: 'Read', days: ['2026-10-01'] }]), true);
  assert.equal(validHabits([{ id: 'h', name: 'Read', days: ['bad'] }]), false);
  assert.equal(validFocus({ '2026-10-01': { goal: 'Read', notes: '', tasks: [{ id: 't', text: 'Book', done: false }] } }), true);
  assert.equal(validFocus({ '2026-10-01': { goal: 'Read', notes: '', tasks: [null] } }), false);
});
test('links reject script and file protocols', () => {
  const item = { id: 'x', name: 'Test', url: 'https://example.com/' };
  assert.equal(validLinks([item]), true);
  for (const url of ['javascript:alert(1)', 'file:///etc/passwd', 'data:text/html,test']) assert.equal(validLinks([{ ...item, url }]), false);
});
test('skin records require known unique steps and completions', () => {
  const log = { notes: '', steps: ['Wash'], done: ['Wash'] };
  assert.equal(validSkin({ '2026-10-01:am': log }), true);
  assert.equal(validSkin({ '2026-10-01:am': { ...log, done: ['Other'] } }), false);
  assert.equal(validSkin({ '2026-10-01:am': { ...log, done: ['Wash', 'Wash'] } }), false);
});
test('list validators reject null elements without crashing', () => {
  for (const validate of [validEvents, validHabits, validTransactions, validLinks]) assert.equal(validate([null]), false);
});
