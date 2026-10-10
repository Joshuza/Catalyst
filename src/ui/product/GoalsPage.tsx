import type { Transaction } from '../../domain/records';
import { GoalAllocation } from './GoalAllocation';
import { useState } from 'react';
import { addDays } from '../../domain/product/dates';
import { project } from '../../domain/product/finance';
import { workspace } from '../local/runtime';
import { Page, Panel, Field, MoneyField, DeleteRecord } from './Common';
import { useProduct, entities, money, run } from './state';
import s from './product.module.css';
export function GoalsPage() {
  const { today, profile, records, busy } = useProduct();
  const [title, setTitle] = useState(''),
    [target, setTarget] = useState(0),
    [reserved, setReserved] = useState(0),
    [date, setDate] = useState(addDays(today, 90)),
    [error, setError] = useState('');
  const goals = entities('goal').filter(
      (g) => g.data.currency === profile.currency,
    ),
    total = goals.reduce((n, g) => n + g.data.reservedCents, 0),
    verified =
      project(
        profile,
        today,
        1,
        [],
        records.filter(
          (r): r is Transaction => r.kind === 'transaction' && !r.deletedAt,
        ),
      )[0]?.actual ?? 0;
  async function save() {
    try {
      if (total + reserved > verified)
        throw new Error(
          'Reserved funds exceed your verified liquid balance. Log cleared income or reduce this reservation.',
        );
      await workspace.save(
        workspace.make(title, {
          type: 'goal',
          targetCents: target,
          reservedCents: reserved,
          date,
          currency: profile.currency,
        }),
      );
      setTitle('');
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Goal could not be saved.');
    }
  }
  return (
    <Page
      title="Savings goals"
      subtitle="Earmark money for the things that matter. Reservations are allocations within your balance, rather than recorded expenses."
    >
      <div className={s.grid}>
        <Panel title="Your available funds" wide>
          <p className={s.metric}>{money(verified - total)}</p>
          <p>
            {money(total)} reserved across {goals.length} goals ·{' '}
            {money(verified)} verified liquid balance.
          </p>
          {verified < total && (
            <p role="status" className={s.alert}>
              Your balance is now below your reservations. Review your goals
              before planning another purchase.
            </p>
          )}
        </Panel>
        <Panel title="Create a goal">
          <form
            className={s.form}
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
          >
            <Field label="Goal name">
              <input
                required
                maxLength={300}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Field>
            <MoneyField
              label="Goal target"
              cents={target}
              onChange={setTarget}
              allowZero={false}
            />
            <MoneyField
              label="Reserve now"
              cents={reserved}
              onChange={setReserved}
            />
            <Field label="Goal date">
              <input
                type="date"
                required
                min={today}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>
            <button className={s.primary} disabled={busy}>
              Save goal
            </button>
            {error && <p role="alert">{error}</p>}
          </form>
        </Panel>
        <Panel title="Your milestones">
          {goals.map((g) => (
            <article key={g.id} className={s.panel}>
              <h3>{g.title}</h3>
              <progress max={g.data.targetCents} value={g.data.reservedCents} />
              <p>
                {money(g.data.reservedCents)} of {money(g.data.targetCents)} ·
                by {g.data.date}
              </p>
              <GoalAllocation
                key={`${g.id}-${g.data.reservedCents}`}
                goal={g}
                available={verified - total + g.data.reservedCents}
              />
              <div className={s.actions}>
                <button
                  type="button"
                  onClick={() =>
                    run(
                      workspace.save({
                        ...g,
                        data: { ...g.data, reservedCents: 0 },
                      }),
                    )
                  }
                >
                  Release reservation
                </button>
                <DeleteRecord record={g} />
              </div>
            </article>
          ))}
          {!goals.length && (
            <p className={s.empty}>
              Add a goal to reserve part of your available cash for a future
              milestone.
            </p>
          )}
        </Panel>
      </div>
    </Page>
  );
}
