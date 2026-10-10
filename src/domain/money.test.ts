import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { addMoney, subtractMoney, parseMoney, formatMoney } from './money';
import { recordSchema, dateSchema } from './records';
import { sampleRecords } from '../fixtures/search';

describe('integer money boundaries', () => {
  it('expands shorthand and supports locale decimal separators without rounding', () => {
    expect(parseMoney('$4.5k')).toBe(450000);
    expect(parseMoney('-1,500.25')).toBe(-150025);
    expect(parseMoney('1.500,25', 'de-DE')).toBe(150025);
    expect(parseMoney('١٬٥٠٠٫٢٥', 'ar-EG')).toBe(150025);
    for (const input of [
      '0.001',
      '1,50',
      'NaN',
      '1e3',
      '90071992547410.00',
      '4.567891k',
    ]) {
      expect(() => parseMoney(input)).toThrow();
    }
  });
  it('property: exact parse/format and additive inverse hold for integer cents', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -100000000, max: 100000000 }),
        fc.integer({ min: -100000000, max: 100000000 }),
        (a, b) => {
          expect(parseMoney(formatMoney(a))).toBe(a);
          expect(subtractMoney(addMoney(a, b), b)).toBe(a);
          expect(Number.isSafeInteger(addMoney(a, b))).toBe(true);
        },
      ),
      { seed: 1049, numRuns: 1000 },
    );
  });
  it('rejects fractional arithmetic, unsafe integers, impossible dates and schema extensions', () => {
    expect(() => addMoney(1.5, 2)).toThrow();
    expect(() => addMoney(Number.MAX_SAFE_INTEGER, 1)).toThrow();
    expect(dateSchema.safeParse('2026-02-30').success).toBe(false);
    expect(dateSchema.safeParse('2026-99-30').success).toBe(false);
    const record = sampleRecords()[2];
    expect(
      recordSchema.safeParse({ ...record, amountCents: 15.5 }).success,
    ).toBe(false);
    expect(
      recordSchema.safeParse({ ...record, script: '<script>bad()</script>' })
        .success,
    ).toBe(false);
  });
});
