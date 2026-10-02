export const $ = (s, root = document) => root.querySelector(s);
export const el = (tag, text, cls) => { const n = document.createElement(tag); if (text !== undefined) n.textContent = text; if (cls) n.className = cls; return n; };
export const clamp = (n, min, max) => Math.min(max, Math.max(min, Number(n) || 0));
export const clean = (v, max = 200) => typeof v === 'string' ? v.slice(0, max) : '';
export const uid = () => crypto.randomUUID();
export const space = (new URLSearchParams(location.search).get('space') || 'personal').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) || 'personal';
const prefix = `notion-widgets:v1:${space}:`;
let memory = {}, blocked = false;
const temporary = new Set();
export function read(key, fallback) { if (temporary.has(key)) return structuredClone(memory[key]); try { const raw = localStorage.getItem(prefix + key); return raw === null ? structuredClone(fallback) : JSON.parse(raw); } catch { blocked = true; return structuredClone(memory[key] ?? fallback); } }
export function save(key, value) { memory[key] = structuredClone(value); let stored = true; try { localStorage.setItem(prefix + key, JSON.stringify(value)); temporary.delete(key); } catch { temporary.add(key); blocked = true; stored = false; } window.dispatchEvent(new CustomEvent('widget-data', { detail: key })); if (!stored) toast('Storage unavailable or full. Changes are temporary; export a backup.', true); return stored; }
export function watch(fn) { window.addEventListener('storage', fn); window.addEventListener('widget-data', fn); }
export function toast(text, error = false) { const n = $('#notice'); if (!n) return; n.textContent = text; n.className = error ? 'notice error' : 'notice'; }
export function button(text, action, cls = '') { const b = el('button', text, cls); b.type = 'button'; b.addEventListener('click', action); return b; }
export function field(label, value = '', type = 'text', opts = {}) {
  const wrap = el('label', undefined, 'field'); wrap.append(el('span', label));
  const n = type === 'textarea' ? el('textarea') : type === 'select' ? el('select') : el('input');
  if (n.tagName === 'INPUT') n.type = type;
  if (type === 'select') for (const item of opts.options || []) { const o = el('option', Array.isArray(item) ? item[1] : item); o.value = Array.isArray(item) ? item[0] : item; n.append(o); }
  if (type === 'checkbox') n.checked = Boolean(value); else n.value = value ?? '';
  for (const [k, v] of Object.entries(opts)) if (k !== 'options') n.setAttribute(k, String(v));
  if (['text', 'textarea', 'url'].includes(type) && !opts.maxlength) n.maxLength = 500;
  wrap.append(n); wrap.value = () => type === 'checkbox' ? n.checked : n.value;
  return wrap;
}
export function dialog(title, build) {
  const d = el('dialog'); const form = el('form'); const header = el('header', undefined, 'dialog-head');
  const h = el('h2', title); h.id = 'dialog-' + uid(); d.setAttribute('aria-labelledby', h.id);
  header.append(h, button('Close', () => d.close(), 'quiet')); form.append(header); d.append(form); document.body.append(d);
  d.addEventListener('close', () => d.remove()); d.addEventListener('click', e => { if (e.target === d) d.close(); });
  form.addEventListener('submit', e => e.preventDefault()); build(form, () => d.close()); d.showModal();
}
export function submit(form, text, action) { const b = el('button', text, 'primary'); b.type = 'submit'; const error = el('p', '', 'notice error'); error.role = 'alert'; form.append(error, b); form.addEventListener('submit', async () => { error.textContent = ''; try { await action(); } catch (e) { error.textContent = e.message || 'Could not save.'; } }); }
export function confirmDelete(label, action) { dialog('Delete ' + label + '?', (f, close) => { f.append(el('p', 'This removes this record from this browser. Export a backup first if you need to keep it.', 'muted')); submit(f, 'Delete record', () => { action(); close(); }); }); }
export function download(name, value, mime = 'application/json') { const blob = new Blob([typeof value === 'string' ? value : JSON.stringify(value, null, 2)], { type: mime }); const url = URL.createObjectURL(blob); const a = el('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
export function safeURL(value) { try { const u = new URL(value); return ['https:', 'http:'].includes(u.protocol) ? u.href : ''; } catch { return ''; } }
export function link(text, url) { const a = el('a', text); a.href = safeURL(url) || '#'; a.target = '_blank'; a.rel = 'noopener noreferrer'; return a; }
export const localDay = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const dayDate = s => new Date(s + 'T12:00:00');
export const validDay = s => /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(dayDate(s)) && localDay(dayDate(s)) === s;
export function shiftDay(s, amount) { const d = dayDate(s); d.setDate(d.getDate() + amount); return localDay(d); }
export function dateLabel(s, options = {}) { return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', ...options }).format(dayDate(s)); }
export function empty(root, title, detail) { const n = el('div', undefined, 'empty'); n.append(el('h3', title), el('p', detail, 'muted')); root.append(n); }
export function metric(root, value, label) { const n = el('div', undefined, 'metric'); n.append(el('strong', value), el('span', label, 'muted')); root.append(n); }
export function progress(value, label) { const n = el('div', undefined, 'progress'); n.role = 'progressbar'; n.setAttribute('aria-label', label); n.setAttribute('aria-valuenow', clamp(value, 0, 100)); n.setAttribute('aria-valuemin', '0'); n.setAttribute('aria-valuemax', '100'); const bar = el('span'); bar.style.width = clamp(value, 0, 100) + '%'; n.append(bar); return n; }
const legacyTheme = { background: '#181b1a', surface: '#252b28', primary: '#b7cfb5', accent: '#e6c58c', text: '#f2f4ed', muted: '#a6b0a8', border: '#3b433e', gradient: '#39483e', gradientOn: false, opacity: 100, radius: 22, shadow: 18, fontSize: 16, font: 'system', density: 'comfortable' };
const baseTheme = { ...legacyTheme, background: '#191919', surface: '#252525', muted: '#b0b0b0', border: '#2b2b2b', gradient: '#242424', radius: 18, shadow: 0 };
const presets = {
  'Notion Dark': baseTheme,
  Forest: legacyTheme,
  Paper: { ...baseTheme, background: '#f4f1eb', surface: '#ffffff', primary: '#335644', accent: '#9b641f', text: '#202b25', muted: '#617068', border: '#d7ddd4', gradient: '#e7eee0' },
  Ocean: { ...baseTheme, background: '#101d30', surface: '#1b2d46', primary: '#79c9df', accent: '#d9aeef', text: '#edf7ff', muted: '#a0b4c9', border: '#354b65', gradient: '#244d62' },
  Plum: { ...baseTheme, background: '#241b2c', surface: '#34273f', primary: '#d6b4ef', accent: '#f1b4a3', text: '#fff0fc', muted: '#c1adc5', border: '#56415f', gradient: '#5a354f' },
};
export function themeValue(obj) {
  const t = { ...baseTheme }; if (!obj || typeof obj !== 'object') return t;
  if (Object.keys(legacyTheme).every(key => obj[key] === legacyTheme[key])) return t;
  for (const key of ['background', 'surface', 'primary', 'accent', 'text', 'muted', 'border', 'gradient']) if (/^#[0-9a-f]{6}$/i.test(obj[key])) t[key] = obj[key];
  for (const [k, min, max] of [['opacity', 0, 100], ['radius', 0, 40], ['shadow', 0, 40], ['fontSize', 14, 24]]) if (Number.isFinite(Number(obj[k]))) t[k] = clamp(obj[k], min, max);
  t.gradientOn = obj.gradientOn === true; t.font = ['system', 'serif', 'mono'].includes(obj.font) ? obj.font : 'system'; t.density = obj.density === 'compact' ? 'compact' : 'comfortable'; return t;
}
function applyTheme(t) {
  const s = document.documentElement.style;
  for (const key of ['background', 'surface', 'primary', 'accent', 'text', 'muted', 'border', 'gradient']) s.setProperty('--' + key, t[key]);
  s.setProperty('--radius', t.radius + 'px'); s.setProperty('--shade', t.shadow / 100); s.setProperty('--opacity', t.opacity + '%');
  s.setProperty('--font-size', t.fontSize + 'px'); s.setProperty('--font', t.font === 'serif' ? 'Georgia, serif' : t.font === 'mono' ? 'ui-monospace, monospace' : 'system-ui, sans-serif');
  document.body.dataset.density = t.density; document.body.dataset.gradient = String(t.gradientOn);
}
export function boot({ id, title, symbol, defaults = {}, configure, render }) {
  const instance = (new URLSearchParams(location.search).get('id') || 'default').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40);
  const key = `config:${id}:${instance}`;
  let cfg = { ...defaults, ...read(key, {}) };
  let theme = themeValue(read('theme:' + id + ':' + instance, read('theme:all', baseTheme)));
  const hash = new URLSearchParams(location.hash.slice(1));
  if (hash.has('theme')) { try { theme = themeValue(JSON.parse(hash.get('theme'))); } catch { /* Invalid links keep the saved theme. */ } }
  applyTheme(theme);
  const card = el('main', undefined, 'widget'); const header = el('header', undefined, 'widget-head'); const head = el('div', undefined, 'brand');
  head.append(el('span', symbol, 'symbol'), el('h1', title)); const settings = button('Settings', openSettings, 'settings'); settings.setAttribute('aria-label', title + ' settings'); header.append(head, settings);
  const root = el('section', undefined, 'content'); const notice = el('p', '', 'notice'); notice.id = 'notice'; notice.role = 'status'; card.append(header, root, notice); document.body.append(card);
  const app = { root, card, get config() { return cfg; }, redraw: () => render(app), setConfig(next) { cfg = { ...cfg, ...next }; save(key, cfg); app.redraw(); }, notify: toast };
  function openSettings() {
    dialog(title + ' settings', (f, close) => {
      f.append(el('p', 'Changes save on this browser. Use Copy theme link to keep the same colors across devices.', 'muted'));
      const specific = el('div', undefined, 'form-grid'); f.append(specific); const getConfig = configure ? configure(specific, cfg) : () => ({});
      f.append(el('h3', 'Appearance'));
      const preset = field('Color preset', '', 'select', { options: [['', 'Custom'], ...Object.keys(presets)] }); f.append(preset);
      const colors = el('div', undefined, 'color-grid'); const controls = {};
      for (const k of ['background', 'surface', 'primary', 'accent', 'text', 'muted', 'border', 'gradient']) {
        const row = el('div', undefined, 'color-item'); const label = el('label', k[0].toUpperCase() + k.slice(1)); const input = el('input'); input.type = 'color'; input.value = theme[k]; input.setAttribute('aria-label', k + ' color');
        const hex = el('input'); hex.value = theme[k]; hex.maxLength = 7; hex.pattern = '#[0-9a-fA-F]{6}'; hex.required = true; hex.setAttribute('aria-label', k + ' hex color');
        input.oninput = () => { hex.value = input.value; }; hex.oninput = () => { if (/^#[0-9a-f]{6}$/i.test(hex.value)) input.value = hex.value; }; row.append(label, input, hex); colors.append(row); controls[k] = hex;
      }
      f.append(colors);
      const extras = el('div', undefined, 'form-grid'); f.append(extras); const opts = {};
      for (const [k, label, type, options] of [['gradientOn', 'Use gradient', 'checkbox', {}], ['opacity', 'Background opacity (%)', 'number', { min: 0, max: 100 }], ['radius', 'Corner radius (px)', 'number', { min: 0, max: 40 }], ['shadow', 'Shadow strength', 'number', { min: 0, max: 40 }], ['fontSize', 'Text size (px)', 'number', { min: 14, max: 24 }], ['font', 'Font', 'select', { options: ['system', 'serif', 'mono'] }], ['density', 'Spacing', 'select', { options: ['comfortable', 'compact'] }]]) { opts[k] = field(label, theme[k], type, options); extras.append(opts[k]); }
      preset.control.onchange = () => { const p = presets[preset.value()]; if (p) { for (const k in controls) { controls[k].value = p[k]; controls[k].previousElementSibling.value = p[k]; } for (const [k, option] of Object.entries(opts)) { if (option.control.type === 'checkbox') option.control.checked = p[k]; else option.control.value = p[k]; } } };
      const all = field('Apply these colors to all widgets on this browser', false, 'checkbox'); f.append(all);
      const nextTheme = () => themeValue({ ...Object.fromEntries(Object.entries(controls).map(([k, n]) => [k, n.value])), ...Object.fromEntries(Object.entries(opts).map(([k, n]) => [k, n.value()])) });
      const actions = el('div', undefined, 'actions');
      actions.append(button('Preview colors', () => applyTheme(nextTheme())), button('Reset appearance', () => { theme = { ...baseTheme }; save('theme:' + id + ':' + instance, theme); applyTheme(theme); close(); openSettings(); }));
      actions.append(button('Copy theme link', async () => { const u = new URL(location.href); u.hash = new URLSearchParams({ theme: JSON.stringify(nextTheme()) }).toString(); try { await navigator.clipboard.writeText(u.href); toast('Theme link copied. Paste this URL into Notion.'); } catch { const input = field('Copy this embed URL', u.href, 'textarea'); f.append(input); input.control.select(); } }));
      actions.append(button('Export settings', () => download(id + '-settings.json', { version: 1, widget: id, theme: nextTheme(), config: cfg })));
      const imp = field('Import this widget settings file', '', 'file', { accept: '.json,application/json' }); imp.control.onchange = async () => { const file = imp.control.files[0]; if (!file) return; try { if (file.size > 2_000_000) throw Error('Settings file is too large.'); const d = JSON.parse(await file.text()); if (d.widget !== id || d.version !== 1 || !d.config || typeof d.config !== 'object' || Array.isArray(d.config)) throw Error('Choose a settings backup for this widget.'); const known = {}; for (const k of Object.keys(defaults)) if (Object.hasOwn(d.config, k) && typeof d.config[k] === typeof defaults[k]) known[k] = d.config[k]; cfg = { ...defaults, ...known }; theme = themeValue(d.theme); save(key, cfg); save('theme:' + id + ':' + instance, theme); applyTheme(theme); close(); app.redraw(); toast('Settings imported.'); } catch (e) { toast(e.message, true); } }; f.append(actions, imp);
      submit(f, 'Save settings', () => { const next = getConfig(); theme = nextTheme(); if (all.value()) { save('theme:all', theme); try { for (let i = localStorage.length - 1; i >= 0; i--) { const k = localStorage.key(i); if (k.startsWith(prefix + 'theme:') && k !== prefix + 'theme:all') localStorage.removeItem(k); } } catch { blocked = true; } } save('theme:' + id + ':' + instance, theme); applyTheme(theme); app.setConfig(next); close(); toast(blocked ? 'Saved temporarily. Storage is unavailable; export a backup.' : 'Settings saved.', blocked); });
      f.parentElement.addEventListener('close', () => applyTheme(theme));
    });
  }
  watch(e => { if (e.type === 'storage') { cfg = { ...defaults, ...read(key, {}) }; if (!hash.has('theme')) { theme = themeValue(read('theme:' + id + ':' + instance, read('theme:all', baseTheme))); applyTheme(theme); } } app.redraw(); });
  app.redraw(); if (blocked) toast('Browser storage is blocked. Open this widget in your browser and use backups.', true);
  setInterval(() => { if (!document.hidden && !document.querySelector('dialog[open]')) app.redraw(); }, 60_000);
  return app;
}
export function fields(container, cfg, specs) { const controls = {}; for (const [key, label, type = 'text', opts = {}] of specs) { controls[key] = field(label, cfg[key], type, opts); container.append(controls[key]); } return () => Object.fromEntries(Object.entries(controls).map(([k, n]) => [k, n.control.type === 'number' ? Number(n.value()) : n.value()])); }
export function datasetTools(root, name, value, validate, write) {
  const box = el('details', undefined, 'backup'); box.append(el('summary', 'Backup / restore'));
  box.append(button('Export data', () => download(name + '-backup.json', { version: 1, kind: name, data: value() })));
  const file = field('Restore backup (replaces current records)', '', 'file', { accept: '.json,application/json' });
  file.control.onchange = async () => { const picked = file.control.files[0]; if (!picked) return; try { if (picked.size > 5_000_000) throw Error('Backup exceeds 5 MB.'); const d = JSON.parse(await picked.text()); if (d.version !== 1 || d.kind !== name || !validate(d.data)) throw Error('This backup is invalid or belongs to another widget.'); dialog('Restore ' + name, (f, close) => { f.append(el('p', 'The imported backup will replace the current records for this data group.')); submit(f, 'Restore backup', () => { write(d.data); close(); toast('Backup restored.'); }); }); } catch (e) { toast(e.message, true); } }; box.append(file); root.append(box);
}
