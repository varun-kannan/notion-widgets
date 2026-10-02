const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export function activeBackground(schedule, date = new Date()) {
  const entries = (Array.isArray(schedule) ? schedule : [])
    .filter(item => item && TIME.test(item.start))
    .sort((a, b) => a.start.localeCompare(b.start));
  if (!entries.length) return null;
  const now = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  return [...entries].reverse().find(item => item.start <= now) ?? entries.at(-1);
}
