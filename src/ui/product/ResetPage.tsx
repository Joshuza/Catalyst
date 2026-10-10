import { useState } from 'react';
import { project } from '../../domain/product/finance';
import { ScheduleAlignment } from './ScheduleAlignment';
import { addDays, daysBetween, weekStart } from '../../domain/product/dates';
import type { UserRecord } from '../../domain/records';
import { workspace } from '../local/runtime';
import { Page, Panel } from './Common';
import { ReceiptReview, ExpenseExport } from './ReceiptsPage';
import { useProduct, entities, run, navigate, money } from './state';
import s from './product.module.css';
export function ResetPage() {
  const { today, profile, records } = useProduct();
  const [step, setStep] = useState(0),
    [statuses, setStatuses] = useState<('done' | 'skipped')[]>([]),
    [done, setDone] = useState(false);
  const names = ['Inbox triage', 'Financial audit', 'Schedule alignment'];
  const messages = records.filter(
    (r): r is Extract<UserRecord, { kind: 'message' }> =>
      r.kind === 'message' && !r.deletedAt && !r.archived && r.unread,
  );
  const tasks = workspace
    .visible('task')
    .filter((t) => t.kind === 'task' && !t.completed);
  const week = addDays(weekStart(today), 7);
  const activity = entities('activity').filter(
    (a) => daysBetween(a.data.date, today) <= 7 && a.data.date <= today,
  );
  const actual = records.filter(
    (r): r is Extract<UserRecord, { kind: 'transaction' }> =>
      r.kind === 'transaction' && !r.deletedAt,
  );
  const points = project(
    profile,
    today,
    7,
    entities('purchase').map((p) => p.data),
    actual,
    'Main',
    entities('subscription').map((v) => v.data),
  );
  const next = async (status: 'done' | 'skipped') => {
    const list = [...statuses, status];
    setStatuses(list);
    if (step === 2) {
      await workspace.save(
        workspace.make(`Weekly reset ${today}`, {
          type: 'reset',
          date: today,
          steps: list,
        }),
      );
      setDone(true);
    } else setStep((v) => v + 1);
  };
  return (
    <Page
      title={done ? 'A little lighter for next week.' : 'The weekly reset'}
      subtitle={`Three focused steps, one at a time. Scheduled for ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][profile.resetDay]}; every step can be skipped.`}
    >
      <div className={s.grid}>
        <Panel
          title={done ? 'Reset complete' : `${step + 1} / 3 · ${names[step]}`}
          wide
        >
          <progress className={s.progress} max="3" value={done ? 3 : step} />
          {done ? (
            <>
              <p>
                {statuses.filter((v) => v === 'done').length} steps completed ·{' '}
                {statuses.filter((v) => v === 'skipped').length} skipped. You
                have {tasks.length} open tasks and{' '}
                {activity.reduce((sum, a) => sum + a.data.miles, 0).toFixed(1)}{' '}
                miles logged this week.
              </p>
              <button type="button" onClick={() => navigate('briefing')}>
                Return to Briefing
              </button>
            </>
          ) : (
            <>
              {step === 0 && (
                <>
                  <p>
                    {messages.length} unread messages. Only likely reply
                    requests are highlighted.
                  </p>
                  {messages
                    .filter((m) => m.replyNeeded)
                    .map((m) => (
                      <div className={s.row} key={m.id}>
                        <span>{m.title} · reply needed</span>
                        <button
                          type="button"
                          onClick={() =>
                            run(workspace.save({ ...m, unread: false }))
                          }
                        >
                          Mark handled
                        </button>
                      </div>
                    ))}
                  <div className={s.actions}>
                    <button
                      type="button"
                      onClick={() =>
                        run(
                          workspace.commit(
                            'Promo triaged',
                            messages
                              .filter((m) => m.stream === 'promotional')
                              .map((m) => ({
                                ...m,
                                archived: true,
                                unread: false,
                              })),
                          ),
                        )
                      }
                    >
                      Archive promotional clutter
                    </button>
                    <button type="button" onClick={() => navigate('inbox')}>
                      Review Inbox
                    </button>
                  </div>
                </>
              )}
              {step === 1 && (
                <>
                  <p>
                    Seven-day planned balance: {money(points.at(-1)?.cart ?? 0)}
                    . Verified balance: {money(points[0]?.actual ?? 0)}.
                  </p>
                  {entities('receipt')
                    .filter((r) => !r.data.accepted)
                    .map((r) => (
                      <ReceiptReview key={r.id} receipt={r} />
                    ))}
                  <p>
                    {
                      entities('purchase').filter(
                        (p) =>
                          p.data.status === 'planned' && p.data.date <= today,
                      ).length
                    }{' '}
                    purchase surveys need answers.
                  </p>
                  <button type="button" onClick={() => navigate('finance')}>
                    Review Financial Core
                  </button>
                  <details>
                    <summary>Monthly expense export</summary>
                    <ExpenseExport />
                  </details>
                </>
              )}
              {step === 2 && (
                <ScheduleAlignment
                  week={week}
                  tasks={tasks.filter(
                    (t): t is Extract<UserRecord, { kind: 'task' }> =>
                      t.kind === 'task',
                  )}
                />
              )}
              <div className={s.actions}>
                <button type="button" onClick={() => run(next('skipped'))}>
                  Skip step
                </button>
                <button
                  type="button"
                  className={s.primary}
                  onClick={() => run(next('done'))}
                >
                  {step === 2 ? 'Finish reset' : 'Complete step'}
                </button>
              </div>
            </>
          )}
        </Panel>
        <Panel title="Loose ends">
          {profile.skipped.length ? (
            <>
              <p>Skipped setup questions:</p>
              <ul>
                {profile.skipped.map((v) => (
                  <li key={v}>{v}</li>
                ))}
              </ul>
              <button type="button" onClick={() => navigate('profile')}>
                Complete skipped preferences
              </button>
            </>
          ) : (
            <p>Your setup checklist is clear.</p>
          )}
          {profile.petEnabled && (
            <>
              <h3>Pet care review</h3>
              {entities('pet')
                .filter((p) => !p.data.completed)
                .map((p) => (
                  <p key={p.id}>
                    {p.title} · {p.data.date}
                  </p>
                ))}
            </>
          )}
          <h3>Contact rhythm</h3>
          {entities('contact')
            .filter(
              (c) =>
                daysBetween(c.data.lastContact, today) >= c.data.rhythmDays,
            )
            .map((c) => (
              <p key={c.id}>{c.title} · check-in due</p>
            ))}
        </Panel>
        <Panel title="Activity this week">
          <p className={s.metric}>
            {activity.reduce((sum, a) => sum + a.data.miles, 0).toFixed(1)}{' '}
            miles
          </p>
          <p>
            {activity.length} outings ·{' '}
            {activity.reduce((sum, a) => sum + a.data.elevationFeet, 0)} ft
            elevation
          </p>
          <button type="button" onClick={() => navigate('profile')}>
            Change reset day
          </button>
        </Panel>
      </div>
    </Page>
  );
}
