import { useMemo, type ReactNode } from 'react';
import { project } from '../../domain/product/finance';
import { addMoney } from '../../domain/money';
import type { Transaction } from '../../domain/records';
import { Panel } from './Common';
import { FinancialChart } from './Chart';
import { WidgetIcon } from './WidgetIcon';
import { useProduct, entities, money } from './state';
import s from './product.module.css';
import { openWidget } from './widget-catalog';
import type { WidgetSize } from '../../domain/product/widgets';

export function MoneyWidget({
  controls,
  expanded = false,
  size = 'large',
}: {
  controls: ReactNode;
  expanded?: boolean;
  size?: WidgetSize;
}) {
  const { profile, today, records } = useProduct();
  const purchases = entities('purchase').map((p) => p.data);
  const subscriptions = entities('subscription').map((s) => s.data);
  const transactions = records.filter(
    (r): r is Transaction => r.kind === 'transaction' && !r.deletedAt,
  );
  // Stable inputs keep clock ticks and unrelated notes/tasks from rebuilding the graph.
  const signature = JSON.stringify({
    profile,
    purchases,
    subscriptions,
    transactions,
    today,
  });
  const points = useMemo(() => {
    const input: {
      profile: typeof profile;
      purchases: typeof purchases;
      subscriptions: typeof subscriptions;
      transactions: typeof transactions;
      today: string;
    } = JSON.parse(signature);
    return project(
      input.profile,
      input.today,
      30,
      input.purchases,
      input.transactions,
      'Main',
      input.subscriptions,
    );
  }, [signature]);
  const pending = purchases.filter(
    (p) =>
      p.status === 'planned' &&
      p.scenario === 'Main' &&
      p.date <= points.at(-1)!.date &&
      (!p.currency || p.currency === profile.currency),
  );
  const current = points[0]!;
  const delta = current.actual - current.baseline;
  return (
    <Panel
      title="Financial velocity"
      wide
      widget="finance"
      size={size}
      icon={<WidgetIcon kind="money" />}
    >
      <div className={s.moneyOverview}>
        <div>
          <span className={s.widgetLabel}>Available now</span>
          <p className={s.balanceNumber}>{money(current.actual)}</p>
          <span className={s.widgetNote}>Verified cash balance</span>
        </div>
        <div className={s.cartSummary} aria-label="Unbought cart, next 30 days">
          <span className={s.widgetLabel}>Cart, next 30 days</span>
          <strong>
            {money(
              pending.reduce((total, p) => addMoney(total, p.costCents), 0),
            )}
          </strong>
          <span className={s.widgetNote}>
            {pending.length} {pending.length === 1 ? 'purchase' : 'purchases'}{' '}
            not bought yet
          </span>
        </div>
      </div>
      <div data-money-expanded={expanded}>
        <FinancialChart
          points={points}
          compact={!expanded}
          measureBeforePaint
        />
      </div>
      {expanded && (
        <p className={s.widgetNote}>
          The projection includes pay dates, scheduled bills, recorded purchases
          and your unbought cart. Recorded purchases stay in the projected
          balance. Matching balances can overlap on the graph.
        </p>
      )}
      <p className={s.widgetNote}>
        Lines stay flat between events. Dotted blue is your plan; actual changes
        when money is recorded.
      </p>
      <div className={s.widgetFooter}>
        <span className={s.widgetNote}>
          {money(Math.abs(delta))} {delta >= 0 ? 'ahead of' : 'behind'} baseline
          today
        </span>
        <button type="button" onClick={() => openWidget('finance')}>
          Open Financial Core <span aria-hidden="true">↗</span>
        </button>
      </div>
      {controls}
    </Panel>
  );
}
