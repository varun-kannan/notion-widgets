import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../netlify/functions/notion-weight.mjs';
import { parseEntryDate, weightView } from '../21-weight-realm/model.js';

test('daily date titles accept supported formats without rolling invalid dates', () => {
  assert.equal(parseEntryDate('2026-10-01'), '2026-10-01');
  assert.equal(parseEntryDate('01/10/2026'), '2026-10-01');
  assert.equal(parseEntryDate('May 15, 2025'), '2025-05-15');
  assert.equal(parseEntryDate('31/02/2026'), null);
  assert.equal(parseEntryDate('Week 1'), null);
});

test('missing end weight is not reported as weight loss', () => {
  const view = weightView({ weekly: [{ week: 'Week 1', date: '2025-05-15', startingWeight: 76 }], daily: [] });
  assert.equal(view.baseline, 76);
  assert.equal(view.latest, null);
  assert.equal(view.change, null);
  assert.equal(view.loggingXp, 0);
});

test('valid daily entries drive trend and nutrition', () => {
  const view = weightView({
    weekly: [{ date: '2025-05-15', startingWeight: 76 }],
    daily: [
      { dateText: '2025-05-16', weight: 75.7, breakfast: 350, lunch: 600, dinner: 550, calorieTarget: 1800, proteinActual: 90, proteinTarget: 100 },
      { dateText: '2025-05-15', weight: 76 },
      { dateText: 'Week 1', weight: 0 },
    ],
  });
  assert.equal(view.latest.weight, 75.7);
  assert.equal(view.change.toFixed(1), '-0.3');
  assert.equal(view.calories, 1500);
  assert.equal(view.undatedCount, 1);
  assert.equal(view.loggingXp, 20);
});

test('weight function rejects missing and incorrect keys without querying Notion', async () => {
  const oldToken = process.env.NOTION_TOKEN;
  const oldKey = process.env.WIDGET_VIEW_KEY;
  const oldFetch = globalThis.fetch;
  let calls = 0;
  try {
    process.env.NOTION_TOKEN = 'test-token';
    process.env.WIDGET_VIEW_KEY = 'test-access-key-that-is-long-enough';
    globalThis.fetch = async () => { calls++; throw new Error('should not query'); };
    const missing = await handler(new Request('https://example.com/.netlify/functions/notion-weight'));
    const wrong = await handler(new Request('https://example.com/.netlify/functions/notion-weight', { headers: { Authorization: 'Bearer wrong' } }));
    assert.equal(missing.status, 401);
    assert.equal(wrong.status, 401);
    assert.equal(calls, 0);
    assert.equal(missing.headers.get('cache-control'), 'private, no-store');
  } finally {
    if (oldToken === undefined) delete process.env.NOTION_TOKEN; else process.env.NOTION_TOKEN = oldToken;
    if (oldKey === undefined) delete process.env.WIDGET_VIEW_KEY; else process.env.WIDGET_VIEW_KEY = oldKey;
    globalThis.fetch = oldFetch;
  }
});

test('weight function maps weekly and daily Notion rows without returning the server token', async () => {
  const oldToken = process.env.NOTION_TOKEN;
  const oldKey = process.env.WIDGET_VIEW_KEY;
  const oldFetch = globalThis.fetch;
  try {
    process.env.NOTION_TOKEN = 'private-test-token';
    process.env.WIDGET_VIEW_KEY = 'test-access-key-that-is-long-enough';
    globalThis.fetch = async url => {
      const weekly = String(url).includes('1b840a44-4c35-8034-9b51-000bc93db86a');
      const page = weekly
        ? { id: 'week-1', properties: { Week: { title: [{ plain_text: 'Week 1' }] }, Date: { date: { start: '2025-05-15' } }, 'Starting Weight': { number: 76 }, 'Daily Tracker': { relation: [] } } }
        : { id: 'day-1', created_time: '2025-05-15T08:00:00Z', properties: { Date: { title: [{ plain_text: 'May 15, 2025' }] }, Weight: { number: 75.8 }, 'Breakfast CC': { number: 350 }, Week: { relation: [{ id: 'week-1' }] } } };
      return new Response(JSON.stringify({ results: [page], has_more: false }), { status: 200 });
    };
    const response = await handler(new Request('https://example.com/.netlify/functions/notion-weight', {
      headers: { Authorization: 'Bearer test-access-key-that-is-long-enough' },
    }));
    const result = await response.json();
    assert.equal(response.status, 200);
    assert.equal(result.weekly[0].startingWeight, 76);
    assert.equal(result.daily[0].weight, 75.8);
    assert.equal(result.daily[0].weekIds[0], 'week-1');
    assert.equal(JSON.stringify(result).includes('private-test-token'), false);
  } finally {
    if (oldToken === undefined) delete process.env.NOTION_TOKEN; else process.env.NOTION_TOKEN = oldToken;
    if (oldKey === undefined) delete process.env.WIDGET_VIEW_KEY; else process.env.WIDGET_VIEW_KEY = oldKey;
    globalThis.fetch = oldFetch;
  }
});
