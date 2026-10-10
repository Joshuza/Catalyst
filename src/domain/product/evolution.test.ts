import { describe, it, expect } from 'vitest';
import { moduleSchema, defaultProfile } from './model';
import { project } from './finance';
import { availableSlots, planSteps, workingHours } from './schedule';
import {
  semanticTags,
  habitStreak,
  rankReading,
  focusCorrelation,
  trialHours,
} from './evolution';
import { addDays } from './dates';
const today = '2026-10-10';
describe('Gemini evolution: research, goals, habits, health, audio and itineraries', () => {
  it('rejects executable images, impossible reservations and inverted trips at the persistence boundary', () => {
    expect(() =>
      moduleSchema.parse({
        type: 'research',
        url: '',
        body: '',
        image: 'data:image/svg+xml,<svg onload="bad()"/>',
        tags: [],
        priority: 'Researching',
        pros: '',
        cons: '',
        costCents: 0,
        purchaseId: null,
      }),
    ).toThrow();
    expect(() =>
      moduleSchema.parse({
        type: 'goal',
        targetCents: 100,
        reservedCents: 101,
        date: today,
        currency: 'USD',
      }),
    ).toThrow();
    expect(() =>
      moduleSchema.parse({
        type: 'itinerary',
        startDate: today,
        endDate: '2026-10-09',
        eventIds: [],
        notes: '',
      }),
    ).toThrow();
    expect(() =>
      moduleSchema.parse({
        type: 'health',
        date: today,
        category: 'Dental',
        notes: '',
        completed: false,
        repeatMonths: 100,
        eventId: null,
      }),
    ).toThrow();
  });
  it('indexes deterministic local tags and counts genuine consecutive check-ins without requiring today to be over', () => {
    expect(
      semanticTags('Camera research', 'Camera lens and camera notes'),
    ).toContain('camera');
    expect(
      semanticTags('Camera research', 'Camera lens and camera notes'),
    ).not.toContain('and');
    expect(habitStreak(['2026-10-08', '2026-10-09', '2026-10-09'], today)).toBe(
      2,
    );
    expect(habitStreak(['2026-10-08', today], today)).toBe(1);
    expect(habitStreak(['2026-10-01'], today)).toBe(0);
  });
  it('uses reading history only as a small preference and hides muted or paused sources', () => {
    const news = (source: string, date: string, read = false) => ({
      title: source,
      data: {
        type: 'news' as const,
        source,
        date,
        read,
        url: '',
        minutes: 4,
        muted: false,
        pausedUntil: null,
      },
    });
    const fresh = news('Fresh', today),
      preferred = news('Favorite', today),
      old = news('Favorite', '2026-10-01'),
      hidden = {
        ...news('Muted', today),
        data: { ...news('Muted', today).data, muted: true },
      };
    const rows = rankReading(
      [fresh, preferred, old, news('Favorite', today, true), hidden],
      today,
    );
    expect(rows[0]).toBe(preferred);
    expect(rows.indexOf(fresh)).toBeLessThan(rows.indexOf(old));
    expect(rows).not.toContain(hidden);
  });
  it('keeps past deposits intact and changes only future primary income in scenarios', () => {
    const p = {
      ...defaultProfile(today),
      balanceDate: '2026-10-03',
      savingsCents: 100000,
      pay: {
        name: 'Pay',
        amountCents: 50000,
        cadence: 'weekly' as const,
        nextDate: '2026-10-03',
      },
    };
    const points = project(p, today, 8, [], [], 'Conservative', [], 50);
    expect(points[0]?.baseline).toBe(175000);
    expect(points.at(-1)?.baseline).toBe(200000);
    expect(points[0]?.actual).toBe(100000);
    expect(p.pay.amountCents).toBe(50000);
    const sharedName = { ...p, streams: [{ ...p.pay }] };
    expect(
      project(sharedName, today, 1, [], [], 'Conservative', [], 50)[0]
        ?.baseline,
    ).toBe(275000);
  });
  it('subtracts monthly and annual subscriptions on anchored charge dates without changing verified cash', () => {
    const p = { ...defaultProfile(today), savingsCents: 100000 };
    const subscription = {
      type: 'subscription' as const,
      amountCents: 1000,
      cadence: 'monthly' as const,
      nextDate: '2026-10-31',
      trialEnd: null,
      billingUrl: '',
    };
    const points = project(p, today, 400, [], [], 'Main', [
      subscription,
      { ...subscription, amountCents: 10000, cadence: 'annual' },
    ]);
    const oct = points.find((v) => v.date === '2026-10-31')!,
      nov = points.find((v) => v.date === '2026-11-30')!;
    expect(oct.cart).toBe(89000);
    expect(nov.cart).toBe(88000);
    expect(nov.baseline).toBe(100000);
    expect(nov.actual).toBe(100000);
  });
  it('requires varied data on seven unique dates for focus patterns and uses exact expiry instants for alerts', () => {
    const rows = Array.from({ length: 7 }, (_, i) => ({
      type: 'screen' as const,
      date: addDays(today, i),
      hours: i,
      focusHours: 7 - i,
    }));
    expect(focusCorrelation(rows)).toBeCloseTo(-1);
    expect(focusCorrelation(rows.slice(0, 6))).toBeNull();
    expect(focusCorrelation(rows.map((r) => ({ ...r, hours: 3 })))).toBeNull();
    expect(
      trialHours(
        '2026-10-12',
        new Date('2026-10-10T12:00:00Z'),
        '2026-10-12T11:00:00Z',
      ),
    ).toBe(47);
    expect(
      trialHours(
        '2026-10-12',
        new Date('2026-10-10T12:00:00Z'),
        '2026-10-12T13:00:00Z',
      ),
    ).toBe(49);
  });
  it('excludes elapsed working hours and fits task plans around commitments with real buffers', () => {
    const p = {
      ...defaultProfile('2026-10-12'),
      shifts: [{ day: 1, start: 9, end: 17 }],
    };
    expect(workingHours(p, '2026-10-12', '2026-10-12', [], 14)).toBe(3);
    expect(
      availableSlots(p, '2026-10-12', '2026-10-12', [], 60, 15, 14.1)[0]?.start,
    ).toBe(14.25);
    const slots = planSteps(
      p,
      '2026-10-12',
      '2026-10-12',
      [
        { title: 'Draft', minutes: 60 },
        { title: 'Review', minutes: 60 },
      ],
      [],
      14,
    )!;
    expect(slots[1]!.start - slots[0]!.start).toBeGreaterThanOrEqual(1.25);
  });
});
