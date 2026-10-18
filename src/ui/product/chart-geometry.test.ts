import { describe, it, expect } from 'vitest';
import { stepLine } from './chart-geometry';
import { project } from '../../domain/product/finance';
import { defaultProfile } from '../../domain/product/profile';
import type { DataOf } from '../../domain/product/model';
import type { Transaction } from '../../domain/records';

describe('FIN-01/02/03: event-based financial graph', () => {
  it('holds through quiet days and jumps on the event date without diagonal interpolation', () => {
    expect(
      stepLine(
        [100, 100, 50, 50, 150, 150],
        (i) => i * 10,
        (v) => v,
      ),
    ).toBe('M0.00,100.00 H20.00 V50.00 H40.00 V150.00 H50.00');
    expect(
      stepLine(
        [0, 0, 0],
        (i) => i,
        (v) => v,
      ),
    ).toBe('M0.00,0.00 H2.00');
    expect(
      stepLine(
        [],
        (i) => i,
        (v) => v,
      ),
    ).toBe('');
    expect(
      stepLine(
        [-10],
        (i) => i,
        (v) => v,
      ),
    ).toBe('M0.00,-10.00');
  });
  it('traces the low-income band backward at the same event boundaries', () => {
    expect(
      stepLine(
        [0, 0, 100, 100, 200],
        (i) => i,
        (v) => v,
        true,
      ),
    ).toBe('M4.00,200.00 H4.00 V100.00 H2.00 V0.00 H0.00');
  });
  it('changes only on pay dates or purchase dates; a planned cart never changes verified cash', () => {
    const profile = {
      ...defaultProfile('2026-01-01'),
      savingsCents: 100000,
      pay: {
        name: 'Salary',
        amountCents: 50000,
        cadence: 'weekly' as const,
        nextDate: '2026-01-05',
      },
    };
    const purchase: DataOf<'purchase'> = {
      type: 'purchase',
      date: '2026-01-03',
      costCents: 20000,
      status: 'planned',
      scenario: 'Main',
      actualCents: null,
      regret: null,
      emotion: null,
      transactionId: null,
    };
    const points = project(profile, '2026-01-01', 7, [purchase]);
    expect(points.map((p) => p.baseline)).toEqual([
      100000, 100000, 100000, 100000, 150000, 150000, 150000,
    ]);
    expect(points.map((p) => p.cart)).toEqual([
      100000, 100000, 80000, 80000, 130000, 130000, 130000,
    ]);
    expect(points.every((p) => p.actual === 100000)).toBe(true);
    for (const status of ['wishlist', 'canceled'] as const)
      expect(
        project(profile, '2026-01-01', 7, [{ ...purchase, status }]).map(
          (p) => p.cart,
        ),
      ).toEqual(points.map((p) => p.baseline));
    const transaction: Transaction = {
      id: '01K00000000000000000000001',
      kind: 'transaction',
      title: 'Purchase',
      amountCents: -21000,
      currency: profile.currency,
      date: '2026-01-03',
      category: 'Purchase',
      receiptFile: null,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      schemaVersion: 1,
      deletedAt: null,
      sampleSet: null,
    };
    const bought = project(
      profile,
      '2026-01-01',
      7,
      [
        {
          ...purchase,
          status: 'bought',
          actualCents: 21000,
          transactionId: transaction.id,
        },
      ],
      [transaction],
    );
    expect(bought[2]).toMatchObject({
      baseline: 100000,
      cart: 79000,
      actual: 79000,
    });
    expect(bought[6]).toMatchObject({
      baseline: 150000,
      cart: 129000,
      actual: 79000,
    });
  });
});
