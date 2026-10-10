import type { Profile, Income, DataOf } from './model';
import type { Transaction } from '../records';
import { addMoney } from '../money';
import { addDays, addMonths, daysBetween } from './dates';
import { chargeDates } from './billing';
export type Deposit = {
  date: string;
  cents: number;
  lowCents: number;
  source: string;
  primary?: boolean;
};
export type Point = {
  date: string;
  baseline: number;
  low: number;
  cart: number;
  actual: number;
};
export function deposits(
  income: Income,
  start: string,
  end: string,
  semiDays: readonly number[] = [1, 15],
): Deposit[] {
  if (income.amountCents === 0) return [];
  const result: Deposit[] = [];
  if (income.cadence === 'semimonthly') {
    let month = start.slice(0, 7) + '-01';
    while (month <= end) {
      for (const day of [...new Set(semiDays)].sort((a, b) => a - b)) {
        const date = month.slice(0, 8) + String(day).padStart(2, '0');
        if (date >= start && date >= income.nextDate && date <= end)
          result.push({
            date,
            cents: income.amountCents,
            lowCents: income.amountCents,
            source: income.name,
          });
      }
      month = addMonths(month, 1);
    }
    return result;
  }
  const interval =
    income.cadence === 'weekly' ? 7 : income.cadence === 'biweekly' ? 14 : 0;
  let index = 0;
  let date = income.nextDate;
  if (interval && date < start) {
    index = Math.ceil(daysBetween(date, start) / interval);
    date = addDays(income.nextDate, index * interval);
  }
  while (date <= end && index < 10000) {
    if (date >= start)
      result.push({
        date,
        cents: income.amountCents,
        lowCents: income.amountCents,
        source: income.name,
      });
    index++;
    date = interval
      ? addDays(income.nextDate, index * interval)
      : addMonths(
          income.nextDate,
          index * (income.cadence === 'quarterly' ? 3 : 1),
        );
  }
  return result;
}
export function incomeDeposits(
  profile: Profile,
  start: string,
  end: string,
): Deposit[] {
  const main =
    profile.pay.cadence === 'irregular'
      ? deposits(
          {
            ...profile.pay,
            cadence: 'monthly',
            amountCents: profile.invoiceCents,
            nextDate: addDays(profile.pay.nextDate, profile.delayDays),
          },
          start,
          end,
        ).map((d) => ({
          ...d,
          lowCents: Math.min(d.cents, profile.lowMonthCents),
        }))
      : deposits(profile.pay, start, end, profile.semiDays);
  return [
    ...main.map((d) => ({ ...d, primary: true })),
    ...profile.streams.flatMap((s) =>
      deposits(s, start, end, profile.semiDays),
    ),
  ].sort((a, b) => a.date.localeCompare(b.date));
}
export function project(
  profile: Profile,
  start: string,
  days: number,
  purchases: DataOf<'purchase'>[] = [],
  transactions: Transaction[] = [],
  scenario = 'Main',
  subscriptions: DataOf<'subscription'>[] = [],
  futurePayPercent = 100,
): Point[] {
  const anchor =
    profile.balanceDate && profile.balanceDate < start
      ? profile.balanceDate
      : start;
  const offset = daysBetween(anchor, start);
  if (offset > 36500)
    throw new Error(
      'Refresh your liquid balance; its anchor is more than 100 years old.',
    );
  const end = addDays(start, days - 1);
  const byDate = new Map<string, { high: number; low: number }>();
  for (const d of incomeDeposits(profile, anchor, end)) {
    const factor = d.date >= start && d.primary ? futurePayPercent / 100 : 1;
    const prior = byDate.get(d.date) ?? { high: 0, low: 0 };
    byDate.set(d.date, {
      high: addMoney(prior.high, Math.round(d.cents * factor)),
      low: addMoney(prior.low, Math.round(d.lowCents * factor)),
    });
  }
  const spending = new Map<string, number>();
  for (const p of purchases.filter(
    (p) =>
      ((p.status === 'planned' && p.scenario === scenario) ||
        (p.status === 'bought' && p.scenario === 'Main')) &&
      (!p.currency || p.currency === profile.currency),
  )) {
    if (p.status === 'bought' && p.date < anchor) continue;
    const date = p.date < anchor ? anchor : p.date;
    spending.set(
      date,
      addMoney(
        spending.get(date) ?? 0,
        p.status === 'bought' ? (p.actualCents ?? p.costCents) : p.costCents,
      ),
    );
  }
  for (const subscription of subscriptions.filter(
    (s) => !s.currency || s.currency === profile.currency,
  )) {
    for (const paid of subscription.paidCharges ?? []) {
      if (paid.date >= anchor && paid.date <= end)
        spending.set(
          paid.date,
          addMoney(spending.get(paid.date) ?? 0, paid.totalCents),
        );
    }
    for (const charge of chargeDates(subscription, anchor, end))
      spending.set(
        charge,
        addMoney(spending.get(charge) ?? 0, subscription.amountCents),
      );
  }
  for (const expense of profile.fixedExpenses ?? []) {
    for (const charge of deposits(
      {
        name: expense.name,
        amountCents: expense.amountCents,
        cadence: 'monthly',
        nextDate: expense.nextDate,
      },
      anchor,
      end,
    )) {
      spending.set(
        charge.date,
        addMoney(spending.get(charge.date) ?? 0, charge.cents),
      );
    }
  }
  const verified = new Map<string, number>();
  for (const t of transactions.filter(
    (t) =>
      !t.deletedAt &&
      t.currency === profile.currency &&
      t.date >= anchor &&
      t.date <= end,
  ))
    verified.set(t.date, addMoney(verified.get(t.date) ?? 0, t.amountCents));
  let baseline = profile.savingsCents,
    low = baseline,
    cart = baseline,
    actual = baseline;
  return Array.from({ length: days + offset }, (_, i) => {
    const date = addDays(anchor, i),
      deposit = byDate.get(date);
    baseline = addMoney(baseline, deposit?.high ?? 0);
    low = addMoney(low, deposit?.low ?? 0);
    cart = addMoney(cart, deposit?.high ?? 0) - (spending.get(date) ?? 0);
    actual = addMoney(actual, verified.get(date) ?? 0);
    if (!Number.isSafeInteger(cart))
      throw new Error('Projection exceeds safe money limits.');
    return { date, baseline, low, cart, actual };
  }).slice(offset);
}
export function safePurchaseDate(
  profile: Profile,
  start: string,
  days: number,
  items: DataOf<'purchase'>[],
  purchase: DataOf<'purchase'>,
  requested: string,
  subscriptions: DataOf<'subscription'>[] = [],
  futurePayPercent = 100,
): string | null {
  const without = project(
    profile,
    start,
    days,
    items.filter((p) => p !== purchase),
    [],
    purchase.scenario,
    subscriptions,
    futurePayPercent,
  );
  const suffix: number[] = [];
  let minimum = Number.POSITIVE_INFINITY;
  for (let i = without.length - 1; i >= 0; i--) {
    minimum = Math.min(minimum, without[i]?.cart ?? 0);
    suffix[i] = minimum;
  }
  const safe = without
    .filter(
      (_, i) =>
        (suffix[i] ?? 0) >=
        purchase.costCents + (profile.safetyBufferCents ?? 0),
    )
    .map((p) => p.date);
  return (
    safe.sort(
      (a, b) =>
        Math.abs(daysBetween(a, requested)) -
          Math.abs(daysBetween(b, requested)) || a.localeCompare(b),
    )[0] ?? null
  );
}
export function threePaycheckMonths(
  profile: Profile,
  start: string,
  end: string,
): string[] {
  if (profile.pay.cadence !== 'biweekly') return [];
  const counts = new Map<string, number>();
  for (const d of deposits(profile.pay, start, end)) {
    const key = d.date.slice(0, 7);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts].filter(([, n]) => n === 3).map(([m]) => m);
}
export function annualCost(s: DataOf<'subscription'>): number {
  return s.cadence === 'annual'
    ? s.amountCents
    : addMoney(0, s.amountCents * 12);
}
