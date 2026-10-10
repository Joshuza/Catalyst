import { useState } from 'react';
import {
  project,
  safePurchaseDate,
  incomeDeposits,
  threePaycheckMonths,
} from '../../domain/product/finance';
import { addDays, addMonths, formatDate } from '../../domain/product/dates';
import type { UserRecord } from '../../domain/records';
import { workspace } from '../local/runtime';
import { ReceiptPrinter } from './Animations';
import { FinancialChart } from './Chart';
import { Page, Panel, Field, MoneyField, DeleteRecord } from './Common';
import {
  useProduct,
  entities,
  saveEntity,
  run,
  money,
  type Entity,
} from './state';
import s from './product.module.css';
import { Scenarios } from './Scenarios';
import { SubscriptionSentinel } from './SubscriptionSentinel';
export function FinancePage() {
  const state = useProduct(),
    items = entities('purchase'),
    scenarios = entities('scenario');
  const [horizon, setHorizon] = useState(365),
    [scenario, setScenario] = useState('Main'),
    [title, setTitle] = useState(''),
    [cost, setCost] = useState(0),
    [date, setDate] = useState(addDays(state.today, 7)),
    [drag, setDrag] = useState<{ id: string; date: string } | null>(null),
    [notice, setNotice] = useState(''),
    [override, setOverride] = useState<{
      item: Entity<'purchase'>;
      date: string;
    } | null>(null),
    [printed, setPrinted] = useState<Entity<'purchase'> | null>(null);
  const scenarioRecord = scenarios.find((v) => v.data.name === scenario);
  const payPercent = scenarioRecord?.data.payPercent ?? 100;
  const reserved = entities('goal')
    .filter((g) => g.data.currency === state.profile.currency)
    .reduce((n, g) => n + g.data.reservedCents, 0);
  const subscriptions = entities('subscription').map((v) => v.data);
  const transactions = state.records.filter(
    (r): r is Extract<UserRecord, { kind: 'transaction' }> =>
      r.kind === 'transaction' && !r.deletedAt,
  );
  const previews = items.map((i) =>
    drag?.id === i.id ? { ...i, data: { ...i.data, date: drag.date } } : i,
  );
  const points = project(
    state.profile,
    state.today,
    horizon,
    previews.map((i) => i.data),
    transactions,
    scenario,
    subscriptions,
    payPercent,
  );
  const move = (
    id: string,
    requested: string,
    phase: 'preview' | 'commit' | 'cancel',
  ) => {
    const item = items.find((i) => i.id === id);
    if (item?.data.currency && item.data.currency !== state.profile.currency) {
      setNotice(
        'Switch to this purchase currency in Profile before changing its affordability date.',
      );
      return;
    }
    if (!item) return;
    if (phase === 'cancel') {
      setDrag(null);
      return;
    }
    if (phase === 'preview') {
      setDrag({ id, date: requested });
      return;
    }
    setDrag(null);
    const safe = safePurchaseDate(
      {
        ...state.profile,
        safetyBufferCents: (state.profile.safetyBufferCents ?? 0) + reserved,
      },
      state.today,
      horizon,
      items.map((i) => i.data),
      item.data,
      requested,
      subscriptions,
      payPercent,
    );
    if (safe !== requested) {
      setOverride({ item, date: requested });
      const next = incomeDeposits(
        state.profile,
        requested,
        addMonths(requested, 1),
      )[0];
      setNotice(
        safe
          ? `Moved to ${formatDate(safe)} to keep every future balance above zero. ${next ? `Next paycheck: ${formatDate(next.date)}.` : ''}`
          : 'No safe date is available in this horizon. Your cart has not changed.',
      );
      if (!safe) return;
    }
    run(saveEntity(item, { date: safe ?? requested }));
  };
  const add = (status: 'wishlist' | 'planned') => {
    if (!title.trim() || cost <= 0) {
      setNotice('Enter a name and a positive cost.');
      return;
    }
    const item = workspace.make(title.trim(), {
      type: 'purchase',
      costCents: cost,
      date,
      status,
      scenario,
      actualCents: null,
      regret: null,
      emotion: null,
      transactionId: null,
    }) as Entity<'purchase'>;
    run(
      workspace.save(item).then(() => {
        setTitle('');
        setPrinted(status === 'planned' ? item : null);
        setNotice(
          status === 'planned'
            ? 'Purchase planned. No payment was made.'
            : 'Saved to your wishlist.',
        );
      }),
    );
  };
  return (
    <Page
      title="Financial core"
      subtitle="Plan purchases against actual pay dates. Your scenarios never change verified records."
    >
      <div className={s.grid}>
        <Panel title="Your financial horizon" wide>
          <div className={s.actions}>
            <Field label="Projection horizon">
              <select
                value={horizon}
                onChange={(e) => setHorizon(Number(e.target.value))}
              >
                <option value="90">90 days</option>
                <option value="365">12 months</option>
                <option value="730">24 months</option>
              </select>
            </Field>
            <Field label="Scenario">
              <select
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
              >
                <option>Main</option>
                {scenarios.map((i) => (
                  <option key={i.id}>{i.data.name}</option>
                ))}
              </select>
            </Field>
            <span className={s.badge}>
              {money(points.at(-1)?.cart ?? 0)} projected
            </span>
          </div>
          {scenarioRecord && (
            <Field label="Scenario primary income percent">
              <input
                type="number"
                min="0"
                max="200"
                step="1"
                value={scenarioRecord.data.payPercent ?? 100}
                onChange={(e) =>
                  run(
                    saveEntity(scenarioRecord, {
                      payPercent: Number(e.target.value),
                    }),
                  )
                }
              />
              <span className={s.muted}>
                Only this scenario's future income assumptions change. Verified
                cash flow and your saved pay profile stay intact.
              </span>
            </Field>
          )}
          <p className={s.muted}>
            Recurring subscriptions are included in the cart projection.
            Baseline shows income; actual shows only cleared records.
          </p>
          {reserved > 0 && (
            <p className={s.muted}>
              {money(reserved)} reserved for savings goals. Safe purchase dates
              preserve these funds.
            </p>
          )}
          <dl className={s.row} aria-label="Today's balances">
            <div>
              <dt>Income baseline</dt>
              <dd>{money(points[0]?.baseline ?? 0)}</dd>
            </div>
            <div>
              <dt>Planned balance</dt>
              <dd>{money(points[0]?.cart ?? 0)}</dd>
            </div>
            <div>
              <dt>Cleared balance</dt>
              <dd>{money(points[0]?.actual ?? 0)}</dd>
            </div>
          </dl>
          <FinancialChart
            points={points}
            items={previews.filter((i) => i.data.scenario === scenario)}
            onMove={move}
          />
          <p className={s.muted}>
            Drag a purchase marker, or focus it and use arrow keys. Shift moves
            two weeks. Near-zero balances are shaded.
          </p>
          <p className={s.muted}>
            Three-paycheck months:{' '}
            {threePaycheckMonths(
              state.profile,
              state.today,
              addDays(state.today, horizon - 1),
            ).join(', ') || 'None in this horizon'}
          </p>
          {notice && (
            <p className={s.alert} role="status">
              {notice}
            </p>
          )}
          {override && (
            <button
              type="button"
              onClick={() => {
                run(saveEntity(override.item, { date: override.date }));
                setOverride(null);
                setNotice(
                  'Your chosen date was kept. The projected shortfall is visible on the chart.',
                );
              }}
            >
              Keep my original date: {override.date}
            </button>
          )}
        </Panel>
        <Panel title="Wishlist & cart">
          <div className={s.form}>
            <Field label="Purchase name">
              <input
                value={title}
                maxLength={300}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Field>
            <div className={s.pair}>
              <MoneyField
                label="Estimated cost"
                cents={cost}
                onChange={setCost}
                allowZero={false}
              />
              <Field label="Purchase date">
                <input
                  type="date"
                  min={state.today}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </Field>
            </div>
            <div className={s.actions}>
              <button
                type="button"
                className={s.primary}
                onClick={() => add('planned')}
                disabled={state.busy}
              >
                Add to cart
              </button>
              <button type="button" onClick={() => add('wishlist')}>
                Save to wishlist
              </button>
            </div>
          </div>
          {items
            .filter((i) => i.data.scenario === scenario)
            .map((item) => (
              <div className={s.row} key={item.id}>
                <div>
                  <strong>{item.title}</strong>
                  <p className={s.muted}>
                    {money(item.data.costCents, item.data.currency)} ·{' '}
                    {item.data.status}
                    {item.data.status === 'canceled'
                      ? ' · saved ' +
                        money(item.data.costCents, item.data.currency)
                      : ''}
                  </p>
                </div>
                <div className={s.actions}>
                  {item.data.status === 'wishlist' && (
                    <button
                      type="button"
                      onClick={() =>
                        run(
                          saveEntity(item, { status: 'planned' }).then(() =>
                            setPrinted({
                              ...item,
                              data: { ...item.data, status: 'planned' },
                            }),
                          ),
                        )
                      }
                    >
                      Plan purchase
                    </button>
                  )}
                  {item.data.status === 'planned' && (
                    <Field label={`Date for ${item.title}`}>
                      <input
                        type="date"
                        value={item.data.date}
                        onChange={(e) =>
                          move(item.id, e.target.value, 'commit')
                        }
                      />
                    </Field>
                  )}
                  <DeleteRecord record={item} />
                </div>
              </div>
            ))}
          {printed && (
            <ReceiptPrinter
              key={printed.id}
              title={printed.title}
              cents={printed.data.costCents}
              planned
            />
          )}
        </Panel>
        <div className={s.stack}>
          <Scenarios scenario={scenario} setScenario={setScenario} />
          <SubscriptionSentinel />
        </div>
      </div>
    </Page>
  );
}
