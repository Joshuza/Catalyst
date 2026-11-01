import { useState } from 'react';
import { personalizedReading } from '../../domain/product/reading-preferences';
import { trialHours } from '../../domain/product/evolution';
import { daysBetween, weekday, timeLabel } from '../../domain/product/dates';
import {
  briefingSections,
  compactBriefing,
} from '../../engine/product/briefing';
import type { UserRecord } from '../../domain/records';
import { workspace } from '../local/runtime';
import { MoneyWidget } from './MoneyWidget';
import { WidgetIcon } from './WidgetIcon';
import { Page, Panel } from './Common';
import { useProduct, entities, navigate, run } from './state';
import {
  BriefingControls,
  DeepWorkSetup,
  DashboardTools,
} from './BriefingPreferences';
import s from './product.module.css';
import { BriefingReading } from './BriefingReading';
import { openWidget } from './widget-catalog';
import { WidgetBoard } from './WidgetBoard';
import { useWidgetBoard } from './useWidgetBoard';
export function BriefingPage({ widgets = true }: { widgets?: boolean }) {
  const { sizeOf } = useWidgetBoard();
  const { profile, today, records, deep } = useProduct();
  const [expanded, setExpanded] = useState<string[]>([]);
  const preferences = entities('briefing')[0];
  const [focusSetup, setFocusSetup] = useState(false);
  const [more, setMore] = useState(false);
  const [customizing, setCustomizing] = useState(false);
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
  const visibleSections = compactBriefing(
    sections,
    preferences?.data.pinned ?? [],
    more,
  );
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
  const controls = (id: string) =>
    customizing ? (
      <BriefingControls
        id={id}
        expanded={expanded.includes(id)}
        toggle={() =>
          setExpanded((v) =>
            v.includes(id) ? v.filter((x) => x !== id) : [...v, id],
          )
        }
      />
    ) : null;
  return (
    <Page
      className={s.dashboard}
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
            Set up Catalyst
          </button>
        </div>
      )}
      <DashboardTools
        widgets={widgets}
        customizing={customizing}
        toggle={() => setCustomizing((v) => !v)}
      />
      <WidgetBoard
        enabled={widgets}
        customizing={customizing}
        sections={visibleSections}
      >
        <div className={s.grid} data-briefing-sections>
          {visibleSections.map((id) =>
            id === 'catchup' ? (
              <Panel key={id} title="Welcome back" wide>
                <p>
                  {away} days since your last saved visit. Review{' '}
                  {urgent.length} urgent subscriptions,{' '}
                  {
                    entities('purchase').filter(
                      (p) =>
                        p.data.status === 'planned' && p.data.date <= today,
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
                    <button type="button" onClick={() => openWidget('finance')}>
                      Review billing
                    </button>
                  </div>
                ))}
              </Panel>
            ) : id === 'finance' ? (
              <MoneyWidget
                key={id}
                controls={controls(id)}
                expanded={expanded.includes(id)}
                size={sizeOf('finance')}
              />
            ) : id === 'schedule' ? (
              <Panel
                key={id}
                title="Today, next three"
                widget="calendar"
                size={sizeOf('calendar')}
                icon={<WidgetIcon kind="schedule" />}
              >
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
                <button type="button" onClick={() => openWidget('calendar')}>
                  Open Calendar
                </button>
                {controls(id)}
              </Panel>
            ) : id === 'inbox' ? (
              <Panel
                key={id}
                title={deep ? 'Inbox, quietly' : 'Tri-fold inbox'}
                widget="inbox"
                size={sizeOf('inbox')}
                icon={<WidgetIcon kind="inbox" />}
              >
                <div className={s.row}>
                  {deep ? (
                    <p>
                      {
                        messages.filter((m) => m.stream !== 'promotional')
                          .length
                      }{' '}
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
                        <span>
                          {stream === 'promotional' ? 'Promo' : stream}
                        </span>
                      </div>
                    ))
                  )}
                </div>
                <button type="button" onClick={() => openWidget('inbox')}>
                  Open Inbox
                </button>
                {controls(id)}
              </Panel>
            ) : id === 'reading' ? (
              <BriefingReading
                key={id}
                reading={reading}
                size={sizeOf('reading')}
                controls={controls(id)}
              />
            ) : id === 'tasks' ? (
              <Panel
                key={id}
                title="Next small steps"
                widget="tasks"
                size={sizeOf('tasks')}
              >
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
                <button type="button" onClick={() => openWidget('tasks')}>
                  Open Tasks
                </button>
                {controls(id)}
              </Panel>
            ) : id === 'outdoors' ? (
              <Panel
                key={id}
                title="Weekend outlook"
                widget="outdoors"
                size={sizeOf('outdoors')}
              >
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
                  {
                    entities('outing').filter((o) => o.data.date >= today)
                      .length
                  }{' '}
                  outings planned.{' '}
                  {entities('activity')
                    .filter((a) => daysBetween(a.data.date, today) <= 7)
                    .reduce((sum, a) => sum + a.data.miles, 0)
                    .toFixed(1)}{' '}
                  miles logged this week.
                </p>
                <button type="button" onClick={() => openWidget('outdoors')}>
                  Plan an outing
                </button>
              </Panel>
            ) : id === 'reset' ? (
              <Panel
                key={id}
                title="Your weekly reset"
                widget="reset"
                size={sizeOf('reset')}
              >
                <p>
                  Clear messages, audit purchases, and align next week in three
                  focused steps.
                </p>
                <button type="button" onClick={() => openWidget('reset')}>
                  Begin weekly reset
                </button>
              </Panel>
            ) : null,
          )}
        </div>
      </WidgetBoard>
      {(more || visibleSections.length < sections.length) && (
        <button
          className={s.moreForToday}
          type="button"
          aria-expanded={more}
          onClick={() => setMore((v) => !v)}
        >
          {more ? 'Keep it simple' : 'More for today'}
        </button>
      )}
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
