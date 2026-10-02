import { timingSafeEqual } from 'node:crypto';

const SOURCES = {
  weekly: '1b840a44-4c35-8034-9b51-000bc93db86a',
  daily: '1b840a44-4c35-80e1-ad16-000b611d4967',
};
const responseHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'private, no-store',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
};
const reply = (status, body) => new Response(JSON.stringify(body), { status, headers: responseHeaders });
const title = property => (property?.title ?? property?.rich_text ?? []).map(item => item.plain_text ?? item.text?.content ?? '').join('');
const number = property => Number.isFinite(property?.number) ? property.number : null;
const relation = property => (property?.relation ?? []).map(item => item.id);

function validKey(header, expected) {
  if (!expected || expected.length < 24 || !header?.startsWith('Bearer ')) return false;
  const actual = Buffer.from(header.slice(7));
  const secret = Buffer.from(expected);
  return actual.length === secret.length && timingSafeEqual(actual, secret);
}

async function query(id, token) {
  const rows = [];
  let cursor;
  do {
    let response;
    for (let attempt = 0; attempt < 3; attempt++) {
      response = await fetch(`https://api.notion.com/v1/data_sources/${id}/query`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Notion-Version': '2025-09-03', 'Content-Type': 'application/json' },
        body: JSON.stringify({ page_size: 100, ...(cursor ? { start_cursor: cursor } : {}) }),
        signal: AbortSignal.timeout(10000),
      });
      if (response.status !== 429) break;
      const seconds = Math.min(5, Math.max(1, Number(response.headers.get('retry-after')) || 1));
      await new Promise(resolve => setTimeout(resolve, seconds * 1000));
    }
    if (!response.ok) throw new Error(`Notion query failed (${response.status})`);
    const data = await response.json();
    rows.push(...data.results);
    if (rows.length > 5000) throw new Error('Tracker exceeds supported size');
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);
  return rows;
}

export default async function handler(request) {
  if (request.method !== 'GET') return reply(405, { error: 'Method not allowed' });
  const token = process.env.NOTION_TOKEN;
  const viewKey = process.env.WIDGET_VIEW_KEY;
  if (!token || !viewKey) return reply(503, { error: 'Sync is not configured' });
  if (!validKey(request.headers.get('authorization'), viewKey)) return reply(401, { error: 'Invalid access key' });
  try {
    const [weekly, daily] = await Promise.all([query(SOURCES.weekly, token), query(SOURCES.daily, token)]);
    return reply(200, {
      syncedAt: new Date().toISOString(),
      weekly: weekly.map(page => ({
        id: page.id,
        week: title(page.properties.Week),
        date: page.properties.Date?.date?.start ?? null,
        startingWeight: number(page.properties['Starting Weight']),
        dailyIds: relation(page.properties['Daily Tracker']),
      })),
      daily: daily.map(page => ({
        id: page.id,
        dateText: title(page.properties.Date),
        createdAt: page.created_time,
        weekIds: relation(page.properties.Week),
        weight: number(page.properties.Weight),
        breakfast: number(page.properties['Breakfast CC']),
        lunch: number(page.properties['Lunch CC']),
        dinner: number(page.properties['Dinner CC']),
        burned: number(page.properties['Burned Calorie']),
        calorieTarget: number(page.properties['Daily Calorie Target']),
        proteinTarget: number(page.properties['Protein Target']),
        proteinActual: number(page.properties['Protein actual']),
        carbTarget: number(page.properties['Carb Target']),
        carbActual: number(page.properties['Carb Actual']),
        fatTarget: number(page.properties['Fat Target']),
        fatActual: number(page.properties['Fat Actual']),
        notes: title(page.properties.Notes),
      })),
    });
  } catch {
    return reply(502, { error: 'Could not read the connected Weight Tracker databases' });
  }
}
