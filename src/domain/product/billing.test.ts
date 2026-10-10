import { describe, it, expect } from 'vitest';
import { chargeDates, nextCharge, planningRows } from './billing';
import { project } from './finance';
import { defaultProfile, type DataOf } from './model';
import { reportCsv } from './receipts';
const subscription: DataOf<'subscription'> = {
  type: 'subscription',
  currency: 'USD',
  amountCents: 1000,
  cadence: 'monthly',
  nextDate: '2026-01-31',
  trialEnd: null,
  billingUrl: '',
};
describe('FIN / RCP: subscription history and planning audits', () => {
  it('preserves a month-end anchor after recording a bill, rather than drifting to the 28th', () => {
    const february = {
      ...subscription,
      billingAnchor: '2026-01-31',
      nextDate: nextCharge(subscription),
    };
    expect(february.nextDate).toBe('2026-02-28');
    expect(nextCharge(february)).toBe('2026-03-31');
    expect(chargeDates(february, '2026-02-01', '2026-04-30')).toEqual([
      '2026-02-28',
      '2026-03-31',
      '2026-04-30',
    ]);
  });
  it('does not mix currencies or double count logged bills; actuals require a verified transaction', () => {
    const profile = { ...defaultProfile('2026-01-01'), savingsCents: 10000 };
    const paid = {
      ...subscription,
      billingAnchor: subscription.nextDate,
      nextDate: '2026-02-28',
      paidCharges: [
        {
          date: '2026-01-31',
          scheduledDate: '2026-01-31',
          totalCents: 1200,
          transactionId: 'bill',
        },
      ],
    };
    const points = project(profile, '2026-01-01', 60, [], [], 'Main', [
      paid,
      { ...subscription, currency: 'EUR' },
    ]);
    expect(points.find((p) => p.date === '2026-01-31')!.cart).toBe(8800);
    expect(points.find((p) => p.date === '2026-02-28')!.cart).toBe(7800);
    expect(points.at(-1)!.actual).toBe(10000);
  });
  it('exports planned versus actual variance and leaves planned actuals blank, without emotional tags or executable cells', () => {
    const purchase: DataOf<'purchase'> = {
      type: 'purchase',
      date: '2026-01-31',
      costCents: 20000,
      actualCents: 21240,
      status: 'bought',
      scenario: 'Main',
      regret: 3,
      emotion: 'Impulsive',
      transactionId: 'transaction',
    };
    const rows = planningRows(
      [
        { title: '=RUN()', data: purchase },
        {
          title: 'Waiting',
          data: { ...purchase, actualCents: null, status: 'planned' },
        },
      ],
      '2026-01-01',
      '2026-01-31',
      'USD',
    );
    expect(rows[1]).toEqual([
      '2026-01-31',
      '=RUN()',
      '200.00',
      '212.40',
      '12.40',
      'bought',
      'Main',
      'USD',
    ]);
    expect(rows[2]?.slice(3, 5)).toEqual(['', '']);
    expect(reportCsv(rows)).toContain("'=RUN()");
    expect(reportCsv(rows)).not.toContain('Impulsive');
  });
});
