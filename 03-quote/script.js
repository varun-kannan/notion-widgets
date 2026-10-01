import { boot, fields, el, field, toast, safeURL, clamp } from './core.js';

const UPLOAD_LIMIT = 3000000;
const UPLOAD_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif', 'video/mp4', 'video/webm'];
const DATA_URL = /^data:(image\/(?:png|jpeg|webp|gif|avif)|video\/(?:mp4|webm));base64,/;
const VIDEO_EXT = /\.(mp4|webm|m4v|mov|ogv)(?:$|[?#])/i;
const FITS = ['cover', 'contain', 'fill'];
const OPEN_QUOTE = String.fromCharCode(0x201c);

const mediaKind = (src, choice) => choice === 'image' || choice === 'video' ? choice : src.startsWith('data:video/') || VIDEO_EXT.test(src) ? 'video' : 'image';

boot({ id: 'quote', title: 'A little perspective', symbol: '❞', defaults: { quote: "Don't just exist. Live.", author: '', image: '', imageData: '', mediaType: 'auto', fit: 'cover', blur: 0, bgColor: '', overlay: 55, size: 36, alignment: 'left', italic: true, quoteFont: 'serif' }, configure(root, cfg) {
  const get = fields(root, cfg, [
    ['quote', 'Quote', 'textarea', { required: true, maxlength: 800 }],
    ['author', 'Attribution (optional)'],
    ['image', 'Background URL: image, GIF, or video (blank uses bundled image)', 'url', { maxlength: 2000 }],
    ['mediaType', 'Background type', 'select', { options: [['auto', 'Detect from file'], ['image', 'Image or GIF'], ['video', 'Video']] }],
    ['fit', 'Background fit', 'select', { options: [['cover', 'Fill and crop'], ['contain', 'Show whole media'], ['fill', 'Stretch']] }],
    ['bgColor', 'Color behind the media (optional, e.g. #101413)'],
    ['blur', 'Background blur (px)', 'number', { min: 0, max: 30 }],
    ['overlay', 'Dark overlay (%)', 'number', { min: 0, max: 95 }],
    ['size', 'Quote size (px)', 'number', { min: 22, max: 72 }],
    ['quoteFont', 'Quote font', 'select', { options: [['serif', 'Editorial serif'], ['system', 'Modern sans serif'], ['mono', 'Typewriter']] }],
    ['alignment', 'Alignment', 'select', { options: ['left', 'center', 'right'] }],
    ['italic', 'Italic text', 'checkbox']]);
  let imageData = cfg.imageData;
  const file = field('Or upload an image, GIF, or short video (PNG, JPEG, WebP, GIF, AVIF, MP4, WebM; up to 3 MB)', '', 'file', { accept: UPLOAD_TYPES.join(',') });
  const input = file.querySelector('input');
  input.onchange = async () => {
    const f = input.files[0]; if (!f) return;
    if (f.size > UPLOAD_LIMIT || !UPLOAD_TYPES.includes(f.type)) { toast('Choose a PNG, JPEG, WebP, GIF, AVIF, MP4, or WebM file under 3 MB. For larger files, host them and paste the URL.', true); return; }
    imageData = await new Promise(resolve => { const r = new FileReader(); r.onload = () => resolve(r.result); r.readAsDataURL(f); });
    toast('File selected. Save settings to apply.');
  };
  const clear = field('Use URL / bundled image instead of uploaded file', false, 'checkbox'); root.append(file, clear);
  return () => ({ ...get(), imageData: clear.value() ? '' : imageData });
}, render({ root, config: c }) {
  root.replaceChildren(); const visual = el('div', undefined, 'quote-visual'); visual.style.textAlign = ['left', 'right', 'center'].includes(c.alignment) ? c.alignment : 'left';
  if (/^#[0-9a-f]{3,8}$/i.test(c.bgColor || '')) visual.style.background = c.bgColor;
  const src = DATA_URL.test(c.imageData) ? c.imageData : safeURL(c.image) || 'assets/quote-background.png';
  let media;
  const fail = () => { media.remove(); toast('Background media unavailable. Choose another file or URL in Settings.', true); };
  if (mediaKind(src, c.mediaType) === 'video') {
    media = el('video'); media.muted = true; media.loop = true; media.playsInline = true; media.preload = 'auto'; media.setAttribute('aria-hidden', 'true');
    media.autoplay = !window.matchMedia('(prefers-reduced-motion: reduce)').matches; media.src = src;
  } else { media = el('img'); media.alt = ''; media.src = src; }
  media.className = 'quote-media'; media.style.objectFit = FITS.includes(c.fit) ? c.fit : 'cover'; media.style.filter = c.blur > 0 ? `blur(${clamp(c.blur, 0, 30)}px)` : ''; media.onerror = fail;
  const shade = el('div', undefined, 'quote-shade'); shade.style.background = `rgba(0,0,0,${clamp(c.overlay, 0, 95) / 100})`; const words = el('div', undefined, 'quote-words');
  const q = el('blockquote', c.quote || "Don't just exist. Live."); q.style.fontSize = clamp(c.size, 22, 72) + 'px'; q.style.fontFamily = c.quoteFont === 'system' ? 'system-ui, sans-serif' : c.quoteFont === 'mono' ? 'ui-monospace, monospace' : 'Georgia, serif'; q.style.fontStyle = c.italic ? 'italic' : 'normal'; words.append(el('span', OPEN_QUOTE, 'quote-glyph'), q); if (c.author) words.append(el('p', c.author, 'quote-author')); visual.append(media, shade, words); root.append(visual);
} });
