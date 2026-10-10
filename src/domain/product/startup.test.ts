import { describe, it, expect } from 'vitest';
import { defaultProfile, profileSchema } from './profile';
import { project, safePurchaseDate } from './finance';
import {
  initializeProfile,
  preferenceRules,
  surveyJson,
  surveyResponses,
  workingHourMask,
} from './startup';
import { routeOptions } from './routes';
import { personalizedReading } from './reading-preferences';
const today = '2026-01-01';
describe('ONB: startup financial and planning foundation', () => {
  it('preserves old profiles and exports all new responses as clean, validated JSON', () => {
    const old = defaultProfile(today);
    expect(profileSchema.parse(old)).toEqual(old);
    const profile = {
      ...old,
      persona: 'professional' as const,
      calendarZoom: '6h' as const,
      transitPass: true,
      cycleKind: 'scooter' as const,
      fixedExpenses: [
        { name: 'Rent/Mortgage', amountCents: 100000, nextDate: '2026-01-31' },
      ],
      mediaTopics: ['Finance'],
      digestTime: '08:30',
      petEnabled: true,
      petName: 'Test pet',
      petVetMonths: 6,
      petFoodDays: 21,
      petNextFood: '2026-01-10',
      petNextVet: '2026-07-01',
    };
    const output: unknown = JSON.parse(surveyJson(profile));
    expect(output).toEqual({
      format: 'nexus-survey',
      version: 1,
      responses: surveyResponses(profile),
    });
    expect(surveyResponses(old)).toMatchObject({
      persona: 'hybrid',
      calendarZoom: 'week',
      transitPass: false,
      fixedExpenses: [],
      mediaTopics: [],
      petNextVet: null,
      petNextFood: null,
    });
    expect(() => surveyJson({ ...profile, petFoodDays: 0 })).toThrow();
    expect(() =>
      profileSchema.parse({ ...profile, digestTime: '25:00' }),
    ).toThrow();
  });
  it('charges overhead on real monthly due dates, clamps short months, and never invents actual spending', () => {
    const profile = {
      ...defaultProfile(today),
      savingsCents: 300000,
      fixedExpenses: [
        { name: 'Rent/Mortgage', amountCents: 100000, nextDate: '2026-01-31' },
      ],
    };
    const points = project(profile, today, 90);
    expect(points.find((p) => p.date === '2026-01-30')?.cart).toBe(300000);
    expect(points.find((p) => p.date === '2026-01-31')?.cart).toBe(200000);
    expect(points.find((p) => p.date === '2026-02-28')?.cart).toBe(100000);
    expect(points.find((p) => p.date === '2026-03-31')?.cart).toBe(0);
    expect(
      points.every((p) => p.baseline === 300000 && p.actual === 300000),
    ).toBe(true);
    expect(
      project({ ...profile, fixedExpenses: [] }, today, 90).every(
        (p) => p.cart === 300000,
      ),
    ).toBe(true);
  });
  it('initializes a complete year and a seven-day half-hour mask, including split shifts', () => {
    const profile = {
      ...defaultProfile(today),
      calendarZoom: '12h' as const,
      shifts: [
        { day: 1, start: 9, end: 12 },
        { day: 1, start: 18, end: 20 },
      ],
    };
    const state = initializeProfile(profile, today);
    expect(state.financial).toHaveLength(365);
    expect(state.workingHours).toHaveLength(7);
    expect(state.workingHours.every((s) => s.length === 48)).toBe(true);
    expect(state.workingHours[1]?.filter(Boolean)).toHaveLength(10);
    expect(state.workingHours[1]?.[24]).toBe(false);
    expect(state.workingHours[1]?.[36]).toBe(true);
    expect(state.calendarZoom).toBe('12h');
    expect(
      workingHourMask({ ...profile, shifts: [] })
        .flat()
        .every((v) => !v),
    ).toBe(true);
  });
  it('creates news and transit matrices that retain hard walking exclusions and Light Rail selection', () => {
    const profile = {
      ...defaultProfile(today),
      modes: ['light-rail' as const],
      walkingMiles: 0,
      feeds: ['Vox'],
      mediaTopics: ['Finance'],
      transitPass: true,
    };
    const rules = preferenceRules(profile);
    expect(rules.news).toEqual({
      sources: ['Vox'],
      topics: ['Finance'],
      digestTime: '07:00',
      sourceMode: 'local-import',
    });
    expect(rules.transit).toMatchObject({
      modes: ['light-rail'],
      walkingEnabled: false,
      hasTransitPass: true,
    });
    expect(rules.pet).toBeNull();
    const routes = [
      {
        mode: 'light-rail' as const,
        minutes: 10,
        walkingMiles: 0,
        distanceMiles: 4,
      },
      {
        mode: 'light-rail' as const,
        minutes: 5,
        walkingMiles: 0.01,
        distanceMiles: 4,
      },
      { mode: 'car' as const, minutes: 3, walkingMiles: 0, distanceMiles: 4 },
    ];
    expect(
      routeOptions(profile, routes, 9, {
        rain: false,
        temperatureC: 20,
        sunsetHour: 18,
      }),
    ).toHaveLength(1);
  });
  it('protects walking opt-out and caps actual walk distance even when a manual route reports zero walking access', () => {
    const profile = { ...defaultProfile(today), modes: ['walk' as const] };
    const forecast = { rain: false, temperatureC: 20, sunsetHour: 18 };
    const route = {
      mode: 'walk' as const,
      minutes: 38,
      walkingMiles: 0,
      distanceMiles: 2.1,
    };
    expect(routeOptions(profile, [route], 9, forecast)).toEqual([]);
    expect(
      routeOptions(
        { ...profile, walkingMiles: 0 },
        [{ ...route, distanceMiles: 0 }],
        9,
        forecast,
      ),
    ).toEqual([]);
    expect(
      preferenceRules({ ...profile, walkingMiles: 0 }).transit.modes,
    ).toEqual([]);
  });
  it('includes future overhead in purchase affordability instead of judging only the purchase-day balance', () => {
    const profile = {
      ...defaultProfile(today),
      savingsCents: 10000,
      pay: {
        name: 'Salary',
        cadence: 'monthly' as const,
        nextDate: '2026-01-20',
        amountCents: 20000,
      },
      fixedExpenses: [
        { name: 'Rent', amountCents: 10000, nextDate: '2026-01-15' },
      ],
    };
    const purchase = {
      type: 'purchase' as const,
      costCents: 10000,
      date: today,
      scenario: 'Main',
      status: 'planned' as const,
      emotion: 'Essential' as const,
      transactionId: null,
      regret: null,
      actualCents: null,
    };
    expect(safePurchaseDate(profile, today, 31, [], purchase, today)).toBe(
      '2026-01-20',
    );
  });
  it('prioritizes followed sources and chosen topics while preserving all saved reading', () => {
    const data = {
      type: 'news' as const,
      url: '',
      date: today,
      minutes: 3,
      read: false,
      muted: false,
      pausedUntil: null,
    };
    const items = [
      { title: 'New technology', data: { ...data, source: 'Other' } },
      { title: 'Budget planning', data: { ...data, source: 'Vox' } },
      { title: 'Unrelated headline', data: { ...data, source: 'Other' } },
    ];
    const profile = {
      ...defaultProfile(today),
      feeds: ['Vox'],
      mediaTopics: ['Finance'],
    };
    const result = personalizedReading(items, today, profile);
    expect(result[0]?.title).toBe('Budget planning');
    expect(result).toHaveLength(3);
  });
});
