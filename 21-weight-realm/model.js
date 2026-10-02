function isoDate(year, month, day) {
  const date = new Date(year, month - 1, day, 12);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}` : null;
}

export function parseEntryDate(value) {
  const text = String(value ?? '').trim();
  let match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (match) return isoDate(Number(match[1]), Number(match[2]), Number(match[3]));
  match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text);
  if (match) return isoDate(Number(match[3]), Number(match[2]), Number(match[1]));
  if (/^[A-Za-z]+ \d{1,2},? \d{4}$/.test(text)) {
    const date = new Date(`${text} 12:00`);
    if (!Number.isNaN(date.getTime())) return isoDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
  }
  return null;
}

export function weightView(data) {
  const daily = data.daily.map(row => ({ ...row, date: parseEntryDate(row.dateText) }))
    .filter(row => row.date).sort((a, b) => a.date.localeCompare(b.date));
  const weighIns = daily.filter(row => Number.isFinite(row.weight) && row.weight > 0);
  const baseline = data.weekly.filter(row => Number.isFinite(row.startingWeight) && row.startingWeight > 0)
    .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))[0]?.startingWeight ?? null;
  const latest = weighIns.at(-1) ?? null;
  const latestDaily = daily.at(-1) ?? null;
  const firstWeight = baseline ?? weighIns[0]?.weight ?? null;
  const change = latest && firstWeight !== null ? latest.weight - firstWeight : null;
  const calories = latestDaily && [latestDaily.breakfast, latestDaily.lunch, latestDaily.dinner].some(Number.isFinite)
    ? (latestDaily.breakfast ?? 0) + (latestDaily.lunch ?? 0) + (latestDaily.dinner ?? 0) : null;
  const macros = latestDaily ? [
    { name: 'Protein', actual: latestDaily.proteinActual, target: latestDaily.proteinTarget, unit: 'g' },
    { name: 'Carbs', actual: latestDaily.carbActual, target: latestDaily.carbTarget, unit: 'g' },
    { name: 'Fat', actual: latestDaily.fatActual, target: latestDaily.fatTarget, unit: 'g' },
  ] : [];
  return {
    baseline,
    latest,
    change,
    weighIns,
    daily,
    latestDaily,
    calories,
    macros,
    loggingXp: daily.length * 10,
    undatedCount: data.daily.length - daily.length,
  };
}
