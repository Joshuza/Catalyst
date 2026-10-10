import { describe, it, expect } from 'vitest';
import { parseReceiptText, reportCsv } from './receipts';
import { correlation, parseCsv } from './life';
import { addDays } from './dates';
describe('RCP / SCR: receipts, safe exports and neutral observations', () => {
  it('extracts vendor, date, tax, total and items without treating subtotal as total', () => {
    const r = parseReceiptText(
      'Studio Audio\n2026-10-10\nHeadphones $196.00\nSubtotal $196.00\nTax $16.40\nTotal $212.40',
      '2026-10-01',
    );
    expect(r).toMatchObject({
      vendor: 'Studio Audio',
      date: '2026-10-10',
      totalCents: 21240,
      taxCents: 1640,
      confidence: 1,
    });
    expect(r.items).toContain('Headphones $196.00');
    expect(
      parseReceiptText('Unclear scan', '2026-10-01').confidence,
    ).toBeLessThan(0.9);
  });
  it('escapes spreadsheet formulas and handles quotes and commas', () => {
    const csv = reportCsv([['=cmd', '+sum', '-name', '@formula', 'a,"b"']]);
    expect(csv).toContain("'=");
    expect(csv).toContain("'+");
    expect(csv).toContain('"a,""b"""');
    expect(parseCsv('date,hours,focusHours\n2026-10-10,4,2\n')).toHaveLength(2);
    expect(() => parseCsv('"unclosed')).toThrow();
  });
  it('never claims a pattern with fewer than seven varied days', () => {
    const samples = Array.from({ length: 6 }, (_, i) => ({
      type: 'screen' as const,
      date: addDays('2026-10-01', i),
      hours: i,
      focusHours: 1,
    }));
    expect(correlation(samples, []).r).toBeNull();
    expect(
      correlation(
        [
          ...samples,
          { type: 'screen', date: '2026-10-07', hours: 6, focusHours: 1 },
        ],
        [],
      ).r,
    ).toBeNull();
  });
});
