import { useState } from 'react';
import { habitStreak } from '../../domain/product/evolution';
import { addDays } from '../../domain/product/dates';
import type { DataOf } from '../../domain/product/model';
import { workspace } from '../local/runtime';
import { Page, Panel, Field, DeleteRecord } from './Common';
import { useProduct, entities, run } from './state';
import s from './product.module.css';
export function HabitsPage() {
  const { today, busy } = useProduct();
  const [title, setTitle] = useState(''),
    [target, setTarget] = useState<DataOf<'habit'>['target']>('Daily routine'),
    [limit, setLimit] = useState(2);
  const screen = entities('screen')
    .filter((v) => v.data.date === today)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  return (
    <Page
      title="Habits & streaks"
      subtitle="Build a steady routine with simple daily check-ins. Screen limits use the samples you import, and purchases keep their own regret tags."
    >
      <div className={s.grid}>
        <Panel title="Your daily rhythm" wide>
          {entities('habit').map((h) => {
            const completed = h.data.dates.includes(today),
              met =
                h.data.target === 'Screen limit' &&
                screen &&
                screen.data.hours <= (h.data.screenLimit ?? 24);
            return (
              <article className={s.panel} key={h.id}>
                <div className={s.row}>
                  <div>
                    <h3>{h.title}</h3>
                    <p className={s.metric}>
                      {habitStreak(h.data.dates, today)} day streak
                    </p>
                    <p>
                      {h.data.target}
                      {h.data.screenLimit !== null
                        ? ` · ${h.data.screenLimit} hours maximum`
                        : ''}
                    </p>
                  </div>
                  <div className={s.actions}>
                    <button
                      type="button"
                      disabled={busy}
                      aria-pressed={completed}
                      onClick={() =>
                        run(
                          workspace.save({
                            ...h,
                            data: {
                              ...h.data,
                              dates: completed
                                ? h.data.dates.filter((d) => d !== today)
                                : [...h.data.dates, today],
                            },
                          }),
                        )
                      }
                    >
                      {completed ? 'Undo today’s check-in' : 'Check in today'}
                    </button>
                    <DeleteRecord record={h} />
                  </div>
                </div>
                {h.data.target === 'Screen limit' && (
                  <p className={s.muted}>
                    {screen
                      ? met
                        ? 'Your entered screen sample meets this limit. Confirm your check-in when ready.'
                        : 'Your entered sample is above this limit. You can still record your own check-in.'
                      : 'No screen sample for today. Add one in Screen time before comparing.'}
                  </p>
                )}
                <div
                  className={s.chips}
                  aria-label={`Last seven days for ${h.title}`}
                >
                  {Array.from({ length: 7 }, (_, i) =>
                    addDays(today, i - 6),
                  ).map((d) => (
                    <span className={s.badge} key={d}>
                      {d.slice(5)}{' '}
                      {h.data.dates.includes(d) ? 'Complete' : 'Open'}
                    </span>
                  ))}
                </div>
              </article>
            );
          })}
          {!entities('habit').length && (
            <p className={s.empty}>
              Add a routine and check in each day to see your progress over
              time.
            </p>
          )}
        </Panel>
        <Panel title="Create a habit">
          <form
            className={s.form}
            onSubmit={(e) => {
              e.preventDefault();
              run(
                workspace
                  .save(
                    workspace.make(title, {
                      type: 'habit',
                      target,
                      screenLimit: target === 'Screen limit' ? limit : null,
                      dates: [],
                    }),
                  )
                  .then(() => setTitle('')),
              );
            }}
          >
            <Field label="Habit name">
              <input
                required
                value={title}
                maxLength={300}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Field>
            <Field label="Habit type">
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value as typeof target)}
              >
                {['Daily routine', 'Screen limit', 'Savings review'].map(
                  (v) => (
                    <option key={v}>{v}</option>
                  ),
                )}
              </select>
            </Field>
            {target === 'Screen limit' && (
              <Field label="Daily screen limit hours">
                <input
                  type="number"
                  min="0"
                  max="24"
                  step=".1"
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                />
              </Field>
            )}
            <button className={s.primary} disabled={busy}>
              Save habit
            </button>
          </form>
        </Panel>
        <Panel title="Purchase reflection">
          <p>
            {
              entities('purchase').filter(
                (p) => p.data.status === 'bought' && p.data.regret !== null,
              ).length
            }{' '}
            rated purchases.
          </p>
          {entities('purchase')
            .filter((p) => p.data.status === 'bought' && p.data.regret !== null)
            .slice(-5)
            .map((p) => (
              <p key={p.id}>
                {p.title} · {p.data.emotion || 'No tag'} · regret{' '}
                {p.data.regret}/5
              </p>
            ))}
          <p className={s.muted}>
            Check-ins are self-reported. A streak never claims that a
            subscription was canceled or a bank balance was verified
            automatically.
          </p>
        </Panel>
      </div>
    </Page>
  );
}
