import { describe, it, expect } from 'vitest';
import { defaultProfile, type DataOf } from './model';
import { project, safePurchaseDate } from './finance';
import { groceryDemand, parseIngredient, ingredientAllowed } from './food';
import { personalSlot, protectedTime } from './schedule';
import { forecastSchema, parseHourlyForecast, weatherWindow } from './weather';
import { rankTrail } from './routes';
import { productSamples } from '../../fixtures/product';
import { FixedClock } from '../clock';
const clock = new FixedClock('2026-10-10T12:00:00Z');
const p = () => ({
  ...defaultProfile('2026-10-10'),
  savingsCents: 100000,
  pay: {
    name: 'Pay',
    cadence: 'weekly' as const,
    amountCents: 50000,
    nextDate: '2026-10-11',
  },
});
const buy = (extra: Partial<DataOf<'purchase'>> = {}): DataOf<'purchase'> => ({
  type: 'purchase',
  currency: 'USD',
  costCents: 20000,
  date: '2026-10-10',
  status: 'planned',
  scenario: 'Main',
  actualCents: null,
  regret: null,
  emotion: null,
  transactionId: null,
  ...extra,
});
describe('FIN / FOOD / TRN: trust regressions', () => {
  it('preserves pay history and verified final cost after midnight rather than resetting the balance', () => {
    const purchase = buy({ status: 'bought', actualCents: 21240 });
    const source = productSamples(clock).find((r) => r.kind === 'settings')!;
    const transaction = {
      ...source,
      kind: 'transaction' as const,
      title: 'Headphones',
      amountCents: -21240,
      currency: 'USD',
      date: '2026-10-10',
      category: 'Purchase',
      receiptFile: null,
    };
    const first = project(p(), '2026-10-10', 3, [purchase], [transaction]);
    const next = project(p(), '2026-10-11', 2, [purchase], [transaction]);
    expect(next).toEqual(first.slice(1));
    expect(next[0]).toMatchObject({
      baseline: 150000,
      cart: 128760,
      actual: 78760,
    });
  });
  it('never combines currencies or touches actuals while comparing scenarios', () => {
    const actual = buy({ status: 'bought', actualCents: 18000 });
    expect(
      project(
        p(),
        '2026-10-10',
        1,
        [
          actual,
          buy({ currency: 'EUR' }),
          buy({ scenario: 'Holiday', costCents: 10000 }),
        ],
        [],
        'Holiday',
      )[0]?.cart,
    ).toBe(72000);
  });
  it('requires the safety buffer for every day after a proposed purchase', () => {
    const profile = { ...p(), safetyBufferCents: 95000 };
    const item = buy({ costCents: 10000 });
    expect(
      safePurchaseDate(profile, '2026-10-10', 7, [item], item, '2026-10-10'),
    ).toBe('2026-10-11');
  });
  it('subtracts pantry stock once across several recipes, including fully covered initial ingredients', () => {
    const pantry = [{ name: 'rice', quantity: 100, unit: 'g' }];
    const first = groceryDemand([parseIngredient('80 g rice')], [], pantry);
    expect(first[0]).toMatchObject({ quantity: 0, requiredQuantity: 80 });
    const second = groceryDemand(
      [parseIngredient('120 g rice')],
      first,
      pantry,
    );
    expect(second[0]).toMatchObject({ quantity: 100, requiredQuantity: 200 });
    expect(
      groceryDemand([], second, [{ name: 'rice', quantity: 150, unit: 'g' }])[0]
        ?.quantity,
    ).toBe(50);
  });
  it('parses counts and mixed fractions without treating an ingredient adjective as a unit', () => {
    expect(parseIngredient('2 red peppers')).toMatchObject({
      quantity: 2,
      unit: 'item',
      name: 'red peppers',
    });
    expect(parseIngredient('1 1/2 cup water').quantity).toBeCloseTo(354.882);
    expect(() => parseIngredient('1/0 cup water')).toThrow();
    expect(ingredientAllowed('peanut oil', ['Nut Allergy'])).toBe(false);
  });
  it('never silently schedules a personal errand in a split or night shift', () => {
    const profile = { ...p(), shifts: [{ day: 6, start: 17, end: 23 }] };
    const slot = personalSlot(profile, '2026-10-10', [], 18, 60);
    expect(slot).not.toBeNull();
    expect(protectedTime(profile, slot!)).toBe(false);
    expect(
      personalSlot(
        { ...profile, shifts: [{ day: 6, start: 0, end: 24 }] },
        '2026-10-10',
        [],
      ),
    ).toBeNull();
  });
  it('validates hourly weather and bases a dog heat limit and best window on entered temperatures', () => {
    const forecast = forecastSchema.parse({
      rain: false,
      temperatureC: 20,
      sunsetHour: 18.5,
      hourly: parseHourlyForecast('8, 25, dry\n9, 17, dry\n10, 32, rain'),
    });
    expect(weatherWindow(forecast, 8, 12).find((h) => h.best)?.hour).toBe(9);
    expect(() => parseHourlyForecast('9, 100, snow')).toThrow();
    const trail = productSamples(clock).find(
      (r) => r.kind === 'module' && r.data.type === 'trail',
    );
    if (!trail || trail.kind !== 'module' || trail.data.type !== 'trail')
      throw new Error('Missing sample trail');
    expect(
      rankTrail(
        { ...p(), modes: ['train'], activities: ['Hike'], walkingMiles: 1.5 },
        trail.data,
        480,
        8,
        forecast,
        24,
        true,
      ),
    ).toBeNull();
  });
});
