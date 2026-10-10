import type { DataOf } from './model';
import { addMonths } from './dates';
export function chargeDates(
  subscription: DataOf<'subscription'>,
  start: string,
  end: string,
): string[] {
  const anchor = subscription.billingAnchor ?? subscription.nextDate;
  const months = subscription.cadence === 'annual' ? 12 : 1;
  const result: string[] = [];
  for (let i = 0; i < 1200; i++) {
    const date = addMonths(anchor, i * months);
    if (date > end) break;
    if (
      date >= start &&
      date >= subscription.nextDate &&
      (!subscription.trialEnd || date >= subscription.trialEnd)
    )
      result.push(date);
  }
  return result;
}
export function nextCharge(subscription: DataOf<'subscription'>): string {
  const anchor = subscription.billingAnchor ?? subscription.nextDate;
  for (let i = 1; i <= 1200; i++) {
    const date = addMonths(
      anchor,
      i * (subscription.cadence === 'annual' ? 12 : 1),
    );
    if (date > subscription.nextDate) return date;
  }
  throw new Error(
    'Billing history exceeds 100 years. Update the subscription schedule.',
  );
}
export function planningRows(
  items: { title: string; data: DataOf<'purchase'> }[],
  start: string,
  end: string,
  currency: string,
): unknown[][] {
  return [
    [
      'Date',
      'Item',
      'Planned cost',
      'Actual cost',
      'Variance',
      'Status',
      'Scenario',
      'Currency',
    ],
    ...items
      .filter((p) => p.data.date >= start && p.data.date <= end)
      .map(({ title, data: p }) => [
        p.date,
        title,
        (p.costCents / 100).toFixed(2),
        p.actualCents === null ? '' : (p.actualCents / 100).toFixed(2),
        p.actualCents === null
          ? ''
          : ((p.actualCents - p.costCents) / 100).toFixed(2),
        p.status,
        p.scenario,
        p.currency ?? currency,
      ]),
  ];
}
