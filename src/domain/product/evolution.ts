import type { DataOf } from './model';
import { addDays, daysBetween } from './dates';
export function semanticTags(title: string, body: string): string[] {
  const words = `${title} ${body}`.toLowerCase().match(/[a-z]{3,}/g) ?? [];
  const stop = new Set([
    'the',
    'and',
    'for',
    'with',
    'that',
    'this',
    'from',
    'https',
    'www',
    'com',
    'have',
    'into',
    'your',
    'are',
    'but',
    'not',
    'you',
    'can',
  ]);
  const counts = new Map<string, number>();
  for (const word of words)
    if (!stop.has(word)) counts.set(word, (counts.get(word) ?? 0) + 1);
  return [...counts]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 8)
    .map(([word]) => word);
}
export function habitStreak(dates: string[], today: string): number {
  const done = new Set(dates);
  let day = done.has(today) ? today : addDays(today, -1),
    count = 0;
  while (done.has(day)) {
    count++;
    day = addDays(day, -1);
  }
  return count;
}
export function rankReading<T extends { data: DataOf<'news'> }>(
  articles: T[],
  today: string,
): T[] {
  const history = new Map<string, number>();
  for (const n of articles)
    if (n.data.read)
      history.set(n.data.source, (history.get(n.data.source) ?? 0) + 1);
  const score = (n: T) =>
    -Math.max(0, daysBetween(n.data.date, today)) +
    Math.min(3, history.get(n.data.source) ?? 0) * 0.25;
  return articles
    .filter(
      (n) =>
        !n.data.muted && (!n.data.pausedUntil || n.data.pausedUntil <= today),
    )
    .sort(
      (a, b) =>
        Number(a.data.read) - Number(b.data.read) ||
        score(b) - score(a) ||
        b.data.date.localeCompare(a.data.date),
    );
}
export function focusCorrelation(samples: DataOf<'screen'>[]): number | null {
  const rows = [...new Map(samples.map((s) => [s.date, s])).values()];
  if (rows.length < 7) return null;
  const x = rows.reduce((n, s) => n + s.hours, 0) / rows.length,
    y = rows.reduce((n, s) => n + s.focusHours, 0) / rows.length;
  let cov = 0,
    xx = 0,
    yy = 0;
  for (const s of rows) {
    cov += (s.hours - x) * (s.focusHours - y);
    xx += (s.hours - x) ** 2;
    yy += (s.focusHours - y) ** 2;
  }
  return xx && yy ? cov / Math.sqrt(xx * yy) : null;
}
export function safeImage(value: string): boolean {
  return (
    value === '' ||
    /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(value)
  );
}

export function trialHours(
  trialEnd: string | null,
  now: Date,
  expiry?: string,
): number | null {
  return trialEnd
    ? Math.ceil(
        ((expiry
          ? new Date(expiry)
          : new Date(`${trialEnd}T00:00:00`)
        ).getTime() -
          now.getTime()) /
          3600000,
      )
    : null;
}
