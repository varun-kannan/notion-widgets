import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../netlify/functions/notion-finance.mjs';
import { financeView, monthFromName } from '../20-notion-finance/model.js';

test('month names and finance views use Notion month relations', () => {
  assert.equal(monthFromName('February 2026'), '2026-02');
  const data = {
    months: [{ id: 'feb', name: 'February 2026' }],
    income: [{ id: 'salary', date: '2026-02-01', name: 'Salary', amount: 77000, monthIds: ['feb'] }],
    budgets: [{ id: 'food', name: 'Groceries', amount: 5500, monthIds: ['feb'] }],
    expenses: [{ id: 'shopping', date: '2026-02-08', name: 'Food', amount: 700, categoryIds: ['food'], monthIds: ['feb'] }],
    credit: [{ id: 'card', date: '2026-02-08', name: 'Card purchase', amount: 700, categoryIds: ['food'], monthIds: ['feb'] }],
  };
  const month = financeView(data, 'month', '2026-02-08');
  assert.equal(month.income, 77000);
  assert.equal(month.expenses, 700);
  assert.equal(month.credit, 700);
  assert.deepEqual(month.budgets, [{ name: 'Groceries', amount: 5500, spent: 700 }]);
  assert.deepEqual(month.categories, [{ name: 'Groceries', amount: 700 }]);
  const day = financeView(data, 'day', '2026-02-08');
  assert.equal(day.income, 0);
  assert.equal(day.expenses, 700);
  assert.equal(financeView(data, 'year', '2026-10-01').income, 77000);
});

test('finance function rejects missing and incorrect access keys before querying Notion', async () => {
  const oldToken = process.env.NOTION_TOKEN;
  const oldKey = process.env.WIDGET_VIEW_KEY;
  const oldFetch = globalThis.fetch;
  let fetchCount = 0;
  try {
    process.env.NOTION_TOKEN = 'test-token';
    process.env.WIDGET_VIEW_KEY = 'this-is-a-test-access-key-123456';
    globalThis.fetch = async () => { fetchCount++; throw new Error('should not query'); };
    const missing = await handler(new Request('https://example.com/.netlify/functions/notion-finance'));
    const wrong = await handler(new Request('https://example.com/.netlify/functions/notion-finance', { headers: { Authorization: 'Bearer wrong' } }));
    assert.equal(missing.status, 401);
    assert.equal(wrong.status, 401);
    assert.equal(fetchCount, 0);
    assert.equal(missing.headers.get('cache-control'), 'private, no-store');
  } finally {
    if (oldToken === undefined) delete process.env.NOTION_TOKEN; else process.env.NOTION_TOKEN = oldToken;
    if (oldKey === undefined) delete process.env.WIDGET_VIEW_KEY; else process.env.WIDGET_VIEW_KEY = oldKey;
    globalThis.fetch = oldFetch;
  }
});

test('finance function returns only the fields used by the widget', async () => {
  const oldToken = process.env.NOTION_TOKEN;
  const oldKey = process.env.WIDGET_VIEW_KEY;
  const oldFetch = globalThis.fetch;
  const pages = [
    { id: 'feb', properties: { Month: { title: [{ plain_text: 'February 2026' }] } } },
    { id: 'salary', properties: { 'Source ': { title: [{ plain_text: 'Salary' }] }, Date: { date: { start: '2026-02-01' } }, Amount: { number: 77000 }, Month: { relation: [{ id: 'feb' }] } } },
    { id: 'food', properties: { Category: { title: [{ plain_text: 'Groceries' }] }, Budget: { number: 5500 }, Month: { relation: [{ id: 'feb' }] } } },
    { id: 'expense', properties: { Name: { title: [{ plain_text: 'Lunch' }] }, Date: { date: { start: '2026-02-02' } }, Amount: { number: 250 }, Category: { relation: [{ id: 'food' }] }, Month: { relation: [{ id: 'feb' }] } } },
  ];
  let index = 0;
  try {
    process.env.NOTION_TOKEN = 'server-only-test-token';
    process.env.WIDGET_VIEW_KEY = 'another-test-access-key-123456';
    globalThis.fetch = async (_url, options) => {
      assert.equal(options.headers.Authorization, 'Bearer server-only-test-token');
      const page = pages[index++];
      return new Response(JSON.stringify({ results: page ? [page] : [], has_more: false }), { status: 200 });
    };
    const response = await handler(new Request('https://example.com/.netlify/functions/notion-finance', {
      headers: { Authorization: 'Bearer another-test-access-key-123456' },
    }));
    const result = await response.json();
    assert.equal(response.status, 200);
    assert.equal(index, 5);
    assert.equal(result.income[0].amount, 77000);
    assert.equal(result.budgets[0].name, 'Groceries');
    assert.equal(result.expenses[0].categoryIds[0], 'food');
    assert.equal(JSON.stringify(result).includes('server-only-test-token'), false);
  } finally {
    if (oldToken === undefined) delete process.env.NOTION_TOKEN; else process.env.NOTION_TOKEN = oldToken;
    if (oldKey === undefined) delete process.env.WIDGET_VIEW_KEY; else process.env.WIDGET_VIEW_KEY = oldKey;
    globalThis.fetch = oldFetch;
  }
});
