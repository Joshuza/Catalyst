import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { defaultProfile, type DataOf } from './model';
import {
  deposits,
  incomeDeposits,
  project,
  safePurchaseDate,
  threePaycheckMonths,
} from './finance';
import { addDays, addMonths } from './dates';
import { availableSlots, planSteps, overlap, protectedTime } from './schedule';
import { routeOptions, rankTrail } from './routes';
import {
  dietaryCheck,
  missingIngredients,
  normalizeIngredient,
  scaleIngredients,
} from './food';
import { productSamples } from '../../fixtures/product';
import { FixedClock } from '../clock';
import { taskPrompt, validateProposal } from './tasks';
const profile = () => ({
  ...defaultProfile('2026-01-01'),
  completed: true,
  pay: {
    name: 'Salary',
    amountCents: 450000,
    cadence: 'biweekly' as const,
    nextDate: '2026-01-02',
  },
  savingsCents: 1200000,
});
const purchase = (costCents: number, date: string): DataOf<'purchase'> => ({
  type: 'purchase',
  costCents,
  date,
  status: 'planned',
  scenario: 'Main',
  actualCents: null,
  regret: null,
  emotion: null,
  transactionId: null,
});
describe('ONB / FIN: exact pay dates and affordability', () => {
  it('plots $4,500 bi-weekly as 26 deposits and identifies the three-paycheck months', () => {
    const p = profile(),
      result = deposits(p.pay, '2026-01-01', '2026-12-31');
    expect(result).toHaveLength(26);
    expect(result.reduce((s, v) => s + v.cents, 0)).toBe(26 * 450000);
    expect(threePaycheckMonths(p, '2026-01-01', '2026-12-31')).toHaveLength(2);
  });
  it('clamps month ends without drift through a leap year and honors semi-monthly dates', () => {
    const p = profile();
    const m = deposits(
      { ...p.pay, cadence: 'monthly', nextDate: '2024-01-31' },
      '2024-01-01',
      '2024-04-30',
    );
    expect(m.map((v) => v.date)).toEqual([
      '2024-01-31',
      '2024-02-29',
      '2024-03-31',
      '2024-04-30',
    ]);
    expect(addMonths('2024-01-31', 1)).toBe('2024-02-29');
    expect(
      deposits(
        { ...p.pay, cadence: 'semimonthly', nextDate: '2026-01-01' },
        '2026-01-01',
        '2026-01-31',
        [5, 20],
      ).map((v) => v.date),
    ).toEqual(['2026-01-05', '2026-01-20']);
  });
  it('layers secondary streams and draws the conservative freelance band with payment delay', () => {
    const p = profile();
    p.streams = [
      {
        name: 'Rent',
        cadence: 'monthly',
        amountCents: 10000,
        nextDate: '2026-01-15',
      },
    ];
    expect(
      incomeDeposits(p, '2026-01-01', '2026-01-31').some(
        (d) => d.source === 'Rent',
      ),
    ).toBe(true);
    const irregular = {
      ...p,
      pay: { ...p.pay, cadence: 'irregular' as const, nextDate: '2026-01-01' },
      invoiceCents: 300000,
      lowMonthCents: 100000,
      delayDays: 10,
    };
    const curve = project(irregular, '2026-01-01', 31);
    expect(curve[9]?.baseline).toBe(p.savingsCents);
    expect(curve[10]?.baseline).toBe(p.savingsCents + 300000);
    expect(curve[10]?.low).toBe(p.savingsCents + 100000);
  });
  it('settles a $300 lens after the next paycheck and keeps scenarios separate', () => {
    const p = {
      ...profile(),
      savingsCents: 20000,
      pay: {
        name: 'Salary',
        amountCents: 10000,
        cadence: 'monthly' as const,
        nextDate: '2026-11-10',
      },
    };
    const item = purchase(30000, '2026-11-10');
    expect(project(p, '2026-11-01', 30, [item])[9]?.cart).toBe(0);
    expect(
      project(p, '2026-11-01', 30, [{ ...item, date: '2026-11-07' }])[6]?.cart,
    ).toBe(-10000);
    expect(
      safePurchaseDate(p, '2026-11-01', 30, [item], item, '2026-11-07'),
    ).toBe('2026-11-10');
    expect(
      project(
        p,
        '2026-11-01',
        30,
        [{ ...item, scenario: 'Holiday' }],
        [],
        'Main',
      )[9]?.cart,
    ).toBe(30000);
  });
  it('adding/removing an item restores the curve; total income equals all deposits for 500 seeded cases', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000000 }),
        fc.integer({ min: 1, max: 100000 }),
        fc.integer({ min: 0, max: 100 }),
        (pay, cost, offset) => {
          const p = {
              ...profile(),
              pay: { ...profile().pay, amountCents: pay },
            },
            item = purchase(cost, addDays('2026-01-01', offset));
          const baseline = project(p, '2026-01-01', 365);
          const cart = project(p, '2026-01-01', 365, [item]);
          expect(baseline.at(-1)!.baseline - p.savingsCents).toBe(
            incomeDeposits(p, '2026-01-01', '2026-12-31').reduce(
              (s, d) => s + d.cents,
              0,
            ),
          );
          expect(cart.at(-1)!.cart).toBe(baseline.at(-1)!.cart - cost);
          expect(project(p, '2026-01-01', 365, [])).toEqual(baseline);
        },
      ),
      { seed: 42017, numRuns: 500 },
    );
  });
  it('calculates a 24-month drag projection within one frame', () => {
    const p = profile(),
      items = Array.from({ length: 100 }, (_, i) =>
        purchase(1000, addDays('2026-01-01', i * 5)),
      );
    project(p, '2026-01-01', 730, items);
    const started = performance.now();
    project(p, '2026-01-01', 730, items);
    const elapsed = performance.now() - started;
    console.info(
      `FINANCE_BENCHMARK days=730 items=100 elapsed_ms=${elapsed.toFixed(2)}`,
    );
    expect(elapsed).toBeLessThan(16.67);
  });
});
describe('CAL / TASK: protected schedules with buffers', () => {
  it('counts actual free working hours across split shifts and blocks conflicts', () => {
    const p = {
      ...profile(),
      shifts: [
        { day: 1, start: 9, end: 12 },
        { day: 1, start: 13, end: 17 },
      ],
    };
    const event: DataOf<'event'> = {
      type: 'event',
      date: '2026-10-12',
      start: 10,
      minutes: 60,
      category: 'work',
      taskId: null,
      travelMinutes: 0,
      location: '',
      ticket: 'none',
      reference: '',
    };
    expect(availableSlots(p, event.date, event.date, [event])).toHaveLength(12);
    expect(protectedTime(p, { date: event.date, start: 10, minutes: 30 })).toBe(
      true,
    );
    const slots = planSteps(
      p,
      event.date,
      '2026-10-16',
      [
        { title: 'Read', minutes: 60 },
        { title: 'Draft', minutes: 120 },
      ],
      [event],
    );
    expect(slots).not.toBeNull();
    expect(slots!.some((s) => overlap(s, event))).toBe(false);
    expect(overlap(slots![0]!, slots![1]!)).toBe(false);
  });
  it('shares only the selected card context, validates proposals and rejects invalid data', () => {
    const context = {
      title: 'Selected task',
      details: {
        role: 'student' as const,
        deadline: '2026-10-16',
        resources: [],
        rubric: 'Five sources',
        conversation: '',
        micro: [],
        lastDrawer: null,
      },
      notes: 'Selected notes',
      workingWeek: profile().shifts,
    };
    const prompt = taskPrompt(context);
    expect(prompt).toContain('Selected task');
    expect(prompt).not.toContain('Other task');
    expect(
      validateProposal([{ title: 'Read sources', minutes: 30 }]),
    ).toHaveLength(1);
    expect(() => validateProposal([{ title: 'x', minutes: -1 }])).toThrow();
  });
});
describe('FOOD / TRN / OUT: hard limits', () => {
  const fixtures = productSamples(new FixedClock('2026-10-10T12:00:00Z'));
  it('hides ingredient conflicts, including synonyms, and marks unknown verification neutrally', () => {
    const recipe = fixtures.find((r) => r.kind === 'recipe');
    if (recipe?.kind !== 'recipe') throw new Error('Missing recipe');
    expect(
      dietaryCheck(
        { ...recipe, ingredients: ['walnut pesto'], details: undefined },
        ['Nut Allergy'],
      ).allowed,
    ).toBe(false);
    expect(
      dietaryCheck({ ...recipe, ingredients: ['whey'], details: undefined }, [
        'Dairy-Free',
      ]).allowed,
    ).toBe(false);
    expect(
      dietaryCheck({ ...recipe, ingredients: ['rice'], details: undefined }, [
        'Gluten-Free',
      ]),
    ).toEqual({
      allowed: true,
      unverified: ['Gluten-Free'],
    });
    expect(dietaryCheck(recipe, []).allowed).toBe(true);
  });
  it('normalizes, scales, merges and subtracts the pantry without changing base ingredients', () => {
    const i = {
      name: 'Rice',
      quantity: 1,
      unit: 'kg',
      section: 'Pantry',
      restrictions: [],
    };
    expect(normalizeIngredient(i).quantity).toBe(1000);
    expect(
      scaleIngredients(scaleIngredients([i], 4, 6), 6, 4)[0]!.quantity,
    ).toBe(1);
    expect(
      missingIngredients(
        [i, { ...i, quantity: 0.5 }],
        [{ name: 'rice', quantity: 100, unit: 'g' }],
      )[0]!.quantity,
    ).toBe(1400);
    expect(i.quantity).toBe(1);
  });
  it('never offers a 2.1-mile walk with a 1.5-mile ceiling, excludes car, and respects the next event', () => {
    const p = { ...profile(), modes: ['walk', 'train', 'bicycle'] as const };
    const routes = [
      {
        mode: 'walk' as const,
        minutes: 38,
        walkingMiles: 2.1,
        distanceMiles: 2.1,
      },
      {
        mode: 'train' as const,
        minutes: 12,
        walkingMiles: 0.3,
        distanceMiles: 2.1,
      },
      { mode: 'car' as const, minutes: 9, walkingMiles: 0, distanceMiles: 2.1 },
    ];
    const options = routeOptions(
      { ...p, modes: [...p.modes] },
      routes,
      12,
      { rain: false, temperatureC: 20, sunsetHour: 18 },
      15,
      60,
    );
    expect(options.map((v) => v.mode)).toEqual(['train']);
    expect(
      routeOptions(
        { ...p, modes: [...p.modes] },
        routes,
        12,
        { rain: false, temperatureC: 20, sunsetHour: 18 },
        12.25,
        60,
      ),
    ).toEqual([]);
  });
  it('flags rain and leaves ten minutes earlier on exposed modes', () => {
    const p = { ...profile(), modes: ['bicycle' as const] };
    const routes = [
      {
        mode: 'bicycle' as const,
        minutes: 14,
        walkingMiles: 0,
        distanceMiles: 2.1,
      },
    ];
    const option = routeOptions(p, routes, 12, {
      rain: true,
      temperatureC: 20,
      sunsetHour: 18,
    })[0]!;
    expect(option.warning).toContain('Rain');
    expect(option.departure).toBeCloseTo(12 - 1 / 6);
  });
  it('ranks only reachable outings that finish before sunset and enforces pet heat and distance limits', () => {
    const trail = fixtures.find(
      (r) => r.kind === 'module' && r.data.type === 'trail',
    );
    if (trail?.kind !== 'module' || trail.data.type !== 'trail')
      throw new Error('Missing trail');
    const p = {
      ...profile(),
      modes: ['train' as const],
      activities: ['Hike' as const],
    };
    expect(
      rankTrail(p, trail.data, 480, 8, {
        rain: false,
        temperatureC: 20,
        sunsetHour: 18,
      }),
    ).not.toBeNull();
    expect(
      rankTrail(p, trail.data, 480, 16, {
        rain: false,
        temperatureC: 20,
        sunsetHour: 18,
      }),
    ).toBeNull();
    expect(
      rankTrail(
        p,
        trail.data,
        480,
        8,
        { rain: false, temperatureC: 30, sunsetHour: 18 },
        24,
        true,
      ),
    ).toBeNull();
    expect(
      rankTrail({ ...p, distanceTolerance: 1 }, trail.data, 480, 8, {
        rain: false,
        temperatureC: 20,
        sunsetHour: 18,
      }),
    ).toBeNull();
  });
});
