import { useState } from 'react';
import { personalizedReading } from '../../domain/product/reading-preferences';
import { trialHours } from '../../domain/product/evolution';
import { project } from '../../domain/product/finance';
import { daysBetween, weekday, timeLabel } from '../../domain/product/dates';
import { briefingSections } from '../../engine/product/briefing';
import type { UserRecord } from '../../domain/records';
import { workspace } from '../local/runtime';
import { FinancialChart } from './Chart';
import { Page, Panel } from './Common';
import { useProduct, entities, navigate, run, money } from './state';
import { BriefingControls, DeepWorkSetup } from './BriefingPreferences';
import s from './product.module.css';
export function BriefingPage() {
  const { profile, today, records, deep } = useProduct();
  const [expanded, setExpanded] = useState<string[]>([]);
  const preferences = entities('briefing')[0];
  const [focusSetup, setFocusSetup] = useState(false);
  const urgent = entities('subscription').filter(
    (v) =>
      v.data.nextDate === today ||
      (v.data.trialEnd &&
        trialHours(
          v.data.trialEnd,
          workspace.clock.now(),
          v.data.trialEndAt,
        )! >= 0 &&
        trialHours(
          v.data.trialEnd,
          workspace.clock.now(),
          v.data.trialEndAt,
        )! <= 48),
  );
  const away = preferences
    ? daysBetween(
        preferences.data.previousVisit ?? preferences.data.lastVisit,
        today,
      )
    : 0;
  const sections = briefingSections({
    weekend: [0, 6].includes(weekday(today)),
    deepWork: deep,
    urgent: urgent.length > 0,
    daysAway: away,
    pinned: preferences?.data.pinned ?? [],
    hidden: preferences?.data.hidden ?? [],
  });
  const messages = records.filter(
    (r): r is Extract<UserRecord, { kind: 'message' }> =>
      r.kind === 'message' && !r.deletedAt && !r.archived && r.unread,
  );
  const tasks = workspace
    .visible('task')
    .filter((t) => t.kind === 'task' && !t.completed)
    .sort((a, b) =>
      (a.kind === 'task'
        ? (a.details?.deadline ?? '9999')
        : '9999'
      ).localeCompare(
        b.kind === 'task' ? (b.details?.deadline ?? '9999') : '9999',
      ),
    );
  const schedule = entities('event')
    .filter(
      (e) =>
        e.data.date > today ||
        (e.data.date === today &&
          e.data.start + e.data.minutes / 60 >
            workspace.clock.now().getHours() +
              workspace.clock.now().getMinutes() / 60),
    )
    .sort(
      (a, b) =>
        a.data.date.localeCompare(b.data.date) || a.data.start - b.data.start,
    )
    .slice(0, 3);
  const reading = personalizedReading(entities('news'), today, profile)
    .filter((n) => !n.data.read)
    .slice(0, 3);
  const tx = records.filter(
    (r): r is Extract<UserRecord, { kind: 'transaction' }> =>
      r.kind === 'transaction' && !r.deletedAt,
  );
  const points = project(
    profile,
    today,
    30,
    entities('purchase').map((p) => p.data),
    tx,
    'Main',
    entities('subscription').map((v) => v.data),
  );
  const delta = (points[0]?.actual ?? 0) - (points[0]?.baseline ?? 0);
  const toggleDeep = () => {
    if (deep && preferences)
      run(
        workspace.save({
          ...preferences,
          data: { ...preferences.data, deepWork: false },
        }),
      );
    else setFocusSetup(true);
  };
  const controls = (id: string) => (
    <BriefingControls
      id={id}
      expanded={expanded.includes(id)}
      toggle={() =>
        setExpanded((v) =>
          v.includes(id) ? v.filter((x) => x !== id) : [...v, id],
        )
      }
    />
  );
  return (
    <Page
      title={deep ? 'Room for focused work.' : 'A little clarity for your day.'}
      subtitle={`${new Intl.DateTimeFormat(workspace.locale, { weekday: 'long', month: 'long', day: 'numeric' }).format(workspace.clock.now())}. ${deep ? 'Promotions and reading are quiet while you focus.' : 'Your important signals, together in one morning review.'}`}
      action={
        <button type="button" aria-pressed={deep} onClick={toggleDeep}>
          {deep ? 'End deep work' : 'Start deep work'}
        </button>
      }
    >
      {!profile.completed && (
        <div className={s.alert}>
          <p>Start with your pay dates, working week, and preferences.</p>
          <button type="button" onClick={() => navigate('profile')}>
            Set up Nexus
          </button>
        </div>
      )}
      <div className={s.grid}>
        {sections.map((id) =>
          id === 'catchup' ? (
            <Panel key={id} title="Welcome back" wide>
              <p>
                {away} days since your last saved visit. Review {urgent.length}{' '}
                urgent subscriptions,{' '}
                {
                  entities('purchase').filter(
                    (p) => p.data.status === 'planned' && p.data.date <= today,
                  ).length
                }{' '}
                due purchase surveys, and {tasks.length} open tasks.
              </p>
              <button
                type="button"
                onClick={() =>
                  preferences &&
                  run(
                    workspace.save({
                      ...preferences,
                      data: { ...preferences.data, previousVisit: today },
                    }),
                  )
                }
              >
                Catch-up reviewed
              </button>
            </Panel>
          ) : id === 'sentinel' ? (
            <Panel key={id} title="A deadline needs your attention" wide>
              {urgent.map((v) => (
                <div className={s.row} key={v.id}>
                  <p>
                    {v.title} ·{' '}
                    {v.data.trialEnd
                      ? `Trial ends ${v.data.trialEnd}`
                      : 'Bill due today'}
                  </p>
                  <button type="button" onClick={() => navigate('finance')}>
                    Review billing
                  </button>
                </div>
              ))}
            </Panel>
          ) : id === 'finance' ? (
            <Panel key={id} title="Financial velocity" wide>
              <div className={s.row}>
                <p className={s.metric}>
                  {money(Math.abs(delta))} {delta >= 0 ? 'ahead of' : 'behind'}{' '}
                  baseline today
                </p>
                <button type="button" onClick={() => navigate('finance')}>
                  Open Financial Core
                </button>
              </div>
              <FinancialChart
                points={points}
                compact={!expanded.includes(id)}
              />
              <p className={s.muted}>
                Verified cash flow against your pay-date projection.{' '}
                {profile.pay.amountCents === 0
                  ? 'Add your income in Profile to establish a baseline.'
                  : ''}
              </p>
              {controls(id)}
            </Panel>
          ) : id === 'schedule' ? (
            <Panel key={id} title="Today, next three">
              {schedule.map((e) => (
                <div className={s.row} key={e.id}>
                  <span className={s.badge}>{timeLabel(e.data.start)}</span>
                  <div>
                    <strong>{e.title}</strong>
                    <p className={s.muted}>
                      {e.data.date}
                      {e.data.travelMinutes
                        ? ` · ${e.data.travelMinutes} min travel`
                        : ''}
                    </p>
                  </div>
                </div>
              ))}
              {!schedule.length && (
                <p className={s.empty}>
                  Your schedule is clear. Add a time block in Calendar.
                </p>
              )}
              <button type="button" onClick={() => navigate('calendar')}>
                Open Calendar
              </button>
              {controls(id)}
            </Panel>
          ) : id === 'inbox' ? (
            <Panel key={id} title={deep ? 'Inbox, quietly' : 'Tri-fold inbox'}>
              <div className={s.row}>
                {deep ? (
                  <p>
                    {messages.filter((m) => m.stream !== 'promotional').length}{' '}
                    important unread messages
                  </p>
                ) : (
                  ['work', 'personal', 'promotional'].map((stream) => (
                    <div
                      key={stream}
                      className={stream === 'promotional' ? s.dim : ''}
                    >
                      <p className={s.metric}>
                        {messages.filter((m) => m.stream === stream).length}
                      </p>
                      <span>{stream === 'promotional' ? 'Promo' : stream}</span>
                    </div>
                  ))
                )}
              </div>
              <button type="button" onClick={() => navigate('inbox')}>
                Open Inbox
              </button>
              {controls(id)}
            </Panel>
          ) : id === 'reading' ? (
            <Panel key={id} title="Three things to read">
              {reading.map((n) => (
                <div className={s.row} key={n.id}>
                  <div>
                    <a
                      href={n.data.url || undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {n.title}
                    </a>
                    <p className={s.reading}>
                      {n.data.source} · {n.data.minutes} min read
                    </p>
                  </div>
                </div>
              ))}
              {!reading.length && (
                <p className={s.empty}>
                  Your reading queue is clear. Add a source or article in
                  Reading.
                </p>
              )}
              <button type="button" onClick={() => navigate('reading')}>
                Open Reading
              </button>
              {controls(id)}
            </Panel>
          ) : id === 'tasks' ? (
            <Panel key={id} title="Next small steps">
              {tasks.slice(0, expanded.includes(id) ? 10 : 3).map((t) => (
                <div className={s.row} key={t.id}>
                  <span>{t.title}</span>
                  {t.kind === 'task' && (
                    <span className={s.muted}>
                      {t.details?.deadline ?? 'No deadline'}
                    </span>
                  )}
                </div>
              ))}
              {!tasks.length && (
                <p className={s.empty}>
                  No open tasks. Capture a deliverable when it comes to mind.
                </p>
              )}
              <button type="button" onClick={() => navigate('tasks')}>
                Open Tasks
              </button>
              {controls(id)}
            </Panel>
          ) : id === 'outdoors' ? (
            <Panel key={id} title="Weekend outlook">
              <h3>Household plans</h3>
              {tasks
                .filter(
                  (t) => t.kind === 'task' && t.details?.role === 'personal',
                )
                .slice(0, 3)
                .map((t) => (
                  <p key={t.id}>{t.title}</p>
                ))}
              <p>
                {entities('outing').filter((o) => o.data.date >= today).length}{' '}
                outings planned.{' '}
                {entities('activity')
                  .filter((a) => daysBetween(a.data.date, today) <= 7)
                  .reduce((sum, a) => sum + a.data.miles, 0)
                  .toFixed(1)}{' '}
                miles logged this week.
              </p>
              <button type="button" onClick={() => navigate('outdoors')}>
                Plan an outing
              </button>
            </Panel>
          ) : id === 'reset' ? (
            <Panel key={id} title="Your weekly reset">
              <p>
                Clear messages, audit purchases, and align next week in three
                focused steps.
              </p>
              <button type="button" onClick={() => navigate('reset')}>
                Begin weekly reset
              </button>
            </Panel>
          ) : null,
        )}
      </div>
      {preferences && preferences.data.hidden.length > 0 && (
        <button
          type="button"
          onClick={() =>
            run(
              workspace.save({
                ...preferences,
                data: { ...preferences.data, hidden: [] },
              }),
            )
          }
        >
          Restore hidden briefing sections
        </button>
      )}
      {focusSetup && preferences && (
        <DeepWorkSetup
          preferences={preferences}
          onClose={() => setFocusSetup(false)}
        />
      )}
    </Page>
  );
}
