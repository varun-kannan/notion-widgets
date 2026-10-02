import { timingSafeEqual } from 'node:crypto';

const SOURCES = {
  months: 'b8f68529-c101-4b13-946d-07af95f44754',
  income: '76d168ec-fd53-4144-ac94-15c600107404',
  budgets: '330debf2-9877-435f-bfcd-8dc9e367413d',
  expenses: 'ec36c698-fc07-4103-ad28-bf2f20932a09',
  credit: '1c940a44-4c35-80bc-aade-000b7c0dee9e',
};

const headers = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'private, no-store',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
};

function reply(status, body) {
  return new Response(JSON.stringify(body), { status, headers });
}

function allowedKey(header, expected) {
  if (!expected || expected.length < 24 || !header?.startsWith('Bearer ')) return false;
  const actual = Buffer.from(header.slice(7));
  const wanted = Buffer.from(expected);
  return actual.length === wanted.length && timingSafeEqual(actual, wanted);
}

function text(property) {
  return (property?.title ?? property?.rich_text ?? []).map(part => part.plain_text ?? part.text?.content ?? '').join('');
}

function ids(property) {
  return (property?.relation ?? []).map(item => item.id);
}

function money(property) {
  return Number.isFinite(property?.number) ? property.number : null;
}

async function querySource(id, token) {
  const pages = [];
  let cursor;
  do {
    let response;
    for (let attempt = 0; attempt < 3; attempt++) {
      response = await fetch(`https://api.notion.com/v1/data_sources/${id}/query`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Notion-Version': '2025-09-03',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ page_size: 100, ...(cursor ? { start_cursor: cursor } : {}) }),
        signal: AbortSignal.timeout(10000),
      });
      if (response.status !== 429) break;
      const seconds = Math.min(5, Math.max(1, Number(response.headers.get('retry-after')) || 1));
      await new Promise(resolve => setTimeout(resolve, seconds * 1000));
    }
    if (!response.ok) throw new Error(`Notion query failed (${response.status})`);
    const data = await response.json();
    pages.push(...data.results);
    if (pages.length > 5000) throw new Error('Finance source exceeds the supported size');
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);
  return pages;
}

export default async function handler(request) {
  if (request.method !== 'GET') return reply(405, { error: 'Method not allowed' });
  const token = process.env.NOTION_TOKEN;
  const viewKey = process.env.WIDGET_VIEW_KEY;
  if (!token || !viewKey) return reply(503, { error: 'Sync is not configured' });
  if (!allowedKey(request.headers.get('authorization'), viewKey)) {
    return reply(401, { error: 'Invalid access key' });
  }

  try {
    const results = [];
    for (const id of Object.values(SOURCES)) results.push(await querySource(id, token));
    const [months, income, budgets, expenses, credit] = results;
    return reply(200, {
      syncedAt: new Date().toISOString(),
      months: months.map(page => ({ id: page.id, name: text(page.properties.Month) })),
      income: income.map(page => ({
        id: page.id,
        date: page.properties.Date?.date?.start ?? null,
        name: text(page.properties['Source ']),
        amount: money(page.properties.Amount),
        monthIds: ids(page.properties.Month),
      })),
      budgets: budgets.map(page => ({
        id: page.id,
        name: text(page.properties.Category),
        amount: money(page.properties.Budget),
        monthIds: ids(page.properties.Month),
      })),
      expenses: expenses.map(page => ({
        id: page.id,
        date: page.properties.Date?.date?.start ?? null,
        name: text(page.properties.Name),
        amount: money(page.properties.Amount),
        categoryIds: ids(page.properties.Category),
        paymentMethod: page.properties['Payment Method']?.select?.name ?? null,
        monthIds: ids(page.properties.Month),
      })),
      credit: credit.map(page => ({
        id: page.id,
        date: page.properties.Date?.date?.start ?? null,
        name: text(page.properties.Name),
        amount: money(page.properties.Amount),
        categoryIds: ids(page.properties.Category),
        monthIds: ids(page.properties.Month),
      })),
    });
  } catch {
    return reply(502, { error: 'Could not read the connected Notion databases' });
  }
}
