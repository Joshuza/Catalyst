import type { DataOf } from './model';
export function correlation(
  samples: DataOf<'screen'>[],
  purchases: DataOf<'purchase'>[],
): { count: number; r: number | null } {
  const unique = new Map(samples.map((s) => [s.date, s]));
  const rows = [...unique.values()].map((s) => ({
    x: s.hours,
    y: purchases
      .filter(
        (p) =>
          p.status === 'bought' &&
          p.date === s.date &&
          p.emotion === 'Impulsive',
      )
      .reduce((sum, p) => sum + (p.actualCents ?? p.costCents), 0),
  }));
  if (rows.length < 7) return { count: rows.length, r: null };
  const mx = rows.reduce((a, v) => a + v.x, 0) / rows.length,
    my = rows.reduce((a, v) => a + v.y, 0) / rows.length;
  let cov = 0,
    x = 0,
    y = 0;
  for (const row of rows) {
    cov += (row.x - mx) * (row.y - my);
    x += (row.x - mx) ** 2;
    y += (row.y - my) ** 2;
  }
  return { count: rows.length, r: x && y ? cov / Math.sqrt(x * y) : null };
}
export function parseCsv(text: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [],
    cell = '',
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === ',' && !quoted) {
      row.push(cell);
      cell = '';
    } else if (c === '\n' && !quoted) {
      row.push(cell.replace(/\r$/, ''));
      if (row.some((v) => v.trim())) result.push(row);
      row = [];
      cell = '';
    } else cell += c;
  }
  if (quoted) throw new Error('An imported CSV quote is not closed.');
  if (cell || row.length) {
    row.push(cell.replace(/\r$/, ''));
    result.push(row);
  }
  return result;
}
