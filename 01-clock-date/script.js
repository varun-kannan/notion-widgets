import { boot, fields, el } from './core.js';
const zones = Intl.supportedValuesOf('timeZone');
const app = boot({ id: 'clock', title: 'Time & date', symbol: '\u25f7', defaults: { timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, hour12: true, seconds: false, label: 'Make time for what matters' }, configure: (root, cfg) => fields(root, cfg, [['label', 'Caption'], ['timezone', 'Timezone', 'select', { options: [...new Set([cfg.timezone, 'UTC', ...zones])] }], ['hour12', '12-hour clock', 'checkbox'], ['seconds', 'Show seconds', 'checkbox']]), render(app) {
  const { root, config: c } = app; root.replaceChildren(); const now = new Date(); let zone = c.timezone; try { new Intl.DateTimeFormat(undefined, { timeZone: zone }); } catch { zone = 'UTC'; }
  root.append(el('p', c.label, 'eyebrow'), el('div', new Intl.DateTimeFormat(undefined, { timeZone: zone, hour: '2-digit', minute: '2-digit', second: c.seconds ? '2-digit' : undefined, hour12: c.hour12 }).format(now), 'hero-number clock-time'), el('p', new Intl.DateTimeFormat(undefined, { timeZone: zone, weekday: 'long', day: 'numeric', month: 'long' }).format(now)), el('p', zone.replaceAll('_', ' '), 'muted small'));
} });
setInterval(() => { if (!document.hidden) app.redraw(); }, 1000);
