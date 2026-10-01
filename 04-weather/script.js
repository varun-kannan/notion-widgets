import { boot, el, field, fields, button, metric, toast, read, save } from './core.js';
let busy = false, signature = '', last = 0, current = null, failure = '', app;
const describe = code => code === 0 ? 'Clear sky' : code <= 3 ? 'Partly cloudy' : [45,48].includes(code) ? 'Fog' : code >= 95 ? 'Thunderstorms' : code >= 85 || (code >= 71 && code <= 77) ? 'Snow' : 'Rain';
const symbol = code => code === 0 ? '\u2600' : code <= 3 ? '\u2601' : code >= 95 ? '\u26a1' : code >= 71 && code <= 77 ? '\u2744' : '\u2602';
async function json(url) { const r = await fetch(url, { signal: AbortSignal.timeout(12000), credentials: 'omit', referrerPolicy: 'no-referrer' }); if (!r.ok) throw Error('Weather service is unavailable. Try again shortly.'); return r.json(); }
async function load(c, force = false) {
  const sig = [c.latitude, c.longitude, c.unit].join(':'); if (busy || (!force && sig === signature && Date.now() - last < 900000)) return;
  signature = sig; last = Date.now(); busy = true; failure = ''; const cached = read('weather-cache:' + sig, null); current = cached;
  const p = new URLSearchParams({ latitude: c.latitude, longitude: c.longitude, current: 'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m', daily: 'weather_code,temperature_2m_max,temperature_2m_min', temperature_unit: c.unit, timezone: 'auto', forecast_days: 3 });
  try { const data = await json('https://api.open-meteo.com/v1/forecast?' + p); if (!Number.isFinite(data.current?.temperature_2m)) throw Error('No weather data returned.'); current = { ...data, fetched: Date.now() }; save('weather-cache:' + sig, current); } catch (e) { failure = e.message; } finally { busy = false; app.redraw(); }
}
app = boot({ id: 'weather', title: 'Weather', symbol: '\u2600', defaults: { city: '', latitude: '', longitude: '', unit: 'celsius' }, configure(root, cfg) {
  const search = field('Search city (sent to Open-Meteo)', cfg.city); const results = el('div', undefined, 'stack'); let selected = { city: cfg.city, latitude: cfg.latitude, longitude: cfg.longitude };
  const find = button('Find city', async () => { if (search.value().trim().length < 2) return; find.disabled = true; results.replaceChildren(el('p', 'Searching...', 'muted')); try { const d = await json('https://geocoding-api.open-meteo.com/v1/search?' + new URLSearchParams({ name: search.value().trim(), count: 5, language: 'en', format: 'json' })); results.replaceChildren(); if (!d.results?.length) results.append(el('p', 'No match. Try a nearby city or add the country.', 'muted')); for (const place of d.results || []) { const name = [place.name, place.admin1, place.country].filter(Boolean).join(', '); results.append(button(name, () => { selected = { city: name, latitude: String(place.latitude), longitude: String(place.longitude) }; results.replaceChildren(el('p', 'Selected: ' + name, 'accent')); })); } } catch (e) { results.replaceChildren(el('p', e.message)); } finally { find.disabled = false; } }); root.append(search, find, results);
  const unit = field('Temperature units', cfg.unit, 'select', { options: [['celsius', 'Celsius'], ['fahrenheit', 'Fahrenheit']] }); root.append(unit); return () => ({ ...selected, unit: unit.value() });
}, render({ root, config: c }) {
  root.replaceChildren(); if (!c.city || c.latitude === '' || c.longitude === '') { root.append(el('p', 'Your world, at a glance.', 'eyebrow'), el('div', '--\u00b0', 'hero-number'), el('p', 'Choose your city in Settings.', 'muted')); }
  else {
    const sig = [c.latitude, c.longitude, c.unit].join(':'); if (sig !== signature) current = null; queueMicrotask(() => load(c)); root.append(el('p', c.city, 'eyebrow'));
    if (current) { const w = current.current, degree = c.unit === 'fahrenheit' ? '\u00b0F' : '\u00b0C'; root.append(el('div', symbol(w.weather_code) + ' ' + Math.round(w.temperature_2m) + degree, 'hero-number'), el('p', describe(w.weather_code))); const grid = el('div', undefined, 'grid'); metric(grid, Math.round(w.apparent_temperature) + degree, 'feels like'); metric(grid, Math.round(w.wind_speed_10m) + ' km/h', 'wind'); root.append(grid); const forecast = el('div', undefined, 'forecast'); current.daily.time.forEach((day, i) => { const n = el('div'); n.append(el('span', i === 0 ? 'Today' : new Date(day + 'T12:00').toLocaleDateString(undefined, { weekday: 'short' })), el('b', symbol(current.daily.weather_code[i])), el('span', `${Math.round(current.daily.temperature_2m_max[i])}\u00b0 / ${Math.round(current.daily.temperature_2m_min[i])}\u00b0`)); forecast.append(n); }); root.append(forecast, el('p', 'Updated ' + new Date(current.fetched).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }), 'muted small')); }
    else root.append(el('p', busy ? 'Loading conditions...' : failure || 'Loading conditions...', 'muted'));
    if (failure && current) root.append(el('p', 'Showing saved weather. ' + failure, 'muted small'));
    root.append(button('Refresh', () => load(c, true), 'quiet'));
  }
  const a = el('a', 'Weather: Open-Meteo / locations: GeoNames', 'attribution'); a.href = 'https://open-meteo.com/'; a.target = '_blank'; a.rel = 'noopener noreferrer'; root.append(a);
} });
