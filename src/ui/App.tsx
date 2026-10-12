import { useEffect, useRef, useState, Suspense } from 'react';
import { useTheme, type Theme } from './theme';
import { workspace } from './local/runtime';
import { LocalWorkspace } from './local/LocalWorkspace';
import { useProduct, entities, navigate, type Entity } from './product/state';
import {
  BriefingPage,
  CreatePage,
  ProfilePage,
  FinancePage,
  ReceiptsPage,
  CalendarPage,
  InboxPage,
  TasksPage,
  FoodPage,
  TransitPage,
  OutdoorsPage,
  ContactsPage,
  PetPage,
  ScreenPage,
  ReadingPage,
  ResetPage,
  ConnectionsPage,
  ResearchPage,
  GoalsPage,
  HealthPage,
  HabitsPage,
  AudioPage,
  ItineraryPage,
  Terminal,
} from './product/Pages';
import { PurchaseSurvey } from './product/Survey';
import { Page } from './product/Common';
import s from './product/product.module.css';
import { StartupSurvey } from './onboarding/StartupSurvey';
import { navigation, allPages } from './product/navigation';
function currentPage() {
  const hash = window.location.hash.slice(1);
  return allPages.has(hash) ? hash : 'briefing';
}
export function App() {
  const { theme, setTheme, storageWarning } = useTheme();
  const state = useProduct();
  const [page, setPage] = useState(currentPage),
    [bootDone, setBootDone] = useState(false),
    [mobile, setMobile] = useState(false),
    [terminal, setTerminal] = useState(false),
    [survey, setSurvey] = useState<Entity<'purchase'> | null>(null);
  const main = useRef<HTMLElement>(null),
    visited = useRef(false);
  useEffect(() => {
    void workspace.initialize().catch(() => undefined);
  }, []);
  useEffect(() => {
    if (
      bootDone &&
      page === 'briefing' &&
      state.ready &&
      state.profile.completed &&
      !visited.current
    ) {
      visited.current = true;
      void workspace.rememberVisit().catch(() => undefined);
    }
  }, [bootDone, page, state.ready, state.profile.completed]);
  useEffect(() => {
    const hash = () => {
      setPage(currentPage());
      setMobile(false);
    };
    const change = (e: Event) => {
      const destination = (e as CustomEvent<string>).detail;
      if (allPages.has(destination)) window.location.hash = destination;
    };
    const key = (e: KeyboardEvent) => {
      if (
        document.querySelector(
          'dialog[data-required="true"][open], [data-startup-survey]',
        )
      )
        return;
      if (
        (e.metaKey || e.ctrlKey) &&
        !e.altKey &&
        e.key.toLowerCase() === 'j'
      ) {
        e.preventDefault();
        setTerminal(true);
      }
    };
    window.addEventListener('hashchange', hash);
    window.addEventListener('nexus:navigate', change);
    window.addEventListener('keydown', key);
    return () => {
      window.removeEventListener('hashchange', hash);
      window.removeEventListener('nexus:navigate', change);
      window.removeEventListener('keydown', key);
    };
  }, []);
  useEffect(() => {
    if (bootDone && state.ready && !survey && !terminal) {
      const due = entities('purchase').find(
        (p) =>
          p.data.status === 'planned' &&
          p.data.scenario === 'Main' &&
          p.data.date <= state.today,
      );
      if (due) setSurvey(due);
    }
  }, [bootDone, state.ready, state.records, state.today, survey, terminal]);
  useEffect(() => {
    document.title = `${navigation.flatMap((g) => g.links).find((l) => l[0] === page)?.[1] ?? 'Briefing'} · Catalyst`;
    main.current?.focus({ preventScroll: true });
  }, [page]);
  const displayPage =
    page === 'pet' && !state.profile.petEnabled ? 'profile' : page;
  const views: Record<string, () => React.ReactNode> = {
    create: () => <CreatePage />,
    briefing: () =>
      !state.profile.completed ? <ProfilePage /> : <BriefingPage />,
    profile: () => <ProfilePage />,
    finance: () => <FinancePage />,
    receipts: () => <ReceiptsPage />,
    calendar: () => <CalendarPage />,
    inbox: () => <InboxPage />,
    tasks: () => <TasksPage />,
    food: () => <FoodPage />,
    transit: () => <TransitPage />,
    outdoors: () => <OutdoorsPage />,
    contacts: () => <ContactsPage />,
    pet: () => <PetPage />,
    screen: () => <ScreenPage />,
    reading: () => <ReadingPage />,
    reset: () => <ResetPage />,
    research: () => <ResearchPage />,
    goals: () => <GoalsPage />,
    health: () => <HealthPage />,
    habits: () => <HabitsPage />,
    audio: () => <AudioPage />,
    itineraries: () => <ItineraryPage />,
    connections: () => <ConnectionsPage />,
    records: () => (
      <Page
        title="Notes & records"
        subtitle="Capture research, notes, and transactions. Back up or restore your entire workspace here."
      >
        <p className={s.muted}>
          Use the record tools below to create, search, edit, and export.
        </p>
      </Page>
    ),
  };
  if (!bootDone)
    return state.ready ? (
      <StartupSurvey
        onDone={() => {
          setBootDone(true);
        }}
      />
    ) : (
      <p role={state.error ? 'alert' : 'status'}>
        {state.error || 'Opening your local workspace.'}
      </p>
    );
  return (
    <div className={s.shell}>
      <a
        className={s.skip}
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          main.current?.focus();
        }}
      >
        Skip to content
      </a>
      <aside
        className={s.sidebar}
        data-open={mobile}
        aria-label="Workspace sidebar"
      >
        <a className={s.brand} href="#briefing">
          <span className={s.logo}>C</span>Catalyst
        </a>
        <nav aria-label="Catalyst pages">
          {navigation.map((group) => (
            <div className={s.navGroup} key={group.group}>
              <p className={s.navLabel}>{group.group}</p>
              {group.links
                .filter((l) => l[0] !== 'pet' || state.profile.petEnabled)
                .map(([id, label, icon]) => (
                  <a
                    key={id}
                    href={`#${id}`}
                    className={s.navLink}
                    data-dim={
                      state.deep &&
                      ![
                        'briefing',
                        'tasks',
                        'calendar',
                        'records',
                        'profile',
                      ].includes(id ?? '')
                    }
                    aria-current={displayPage === id ? 'page' : undefined}
                    onClick={() => setMobile(false)}
                  >
                    <span className={s.navIcon} aria-hidden="true">
                      {icon}
                    </span>
                    {label}
                  </a>
                ))}
            </div>
          ))}
        </nav>
        <div className={s.sidebarFoot}>
          <p>LOCAL / PRIVATE / YOURS</p>
          <fieldset className={s.theme}>
            <legend>Theme</legend>
            {(['system', 'light', 'dark'] as Theme[]).map((value) => (
              <label key={value}>
                <input
                  type="radio"
                  name="theme"
                  checked={theme === value}
                  onChange={() => setTheme(value)}
                />
                <span className={s.srOnly}>
                  {value.charAt(0).toUpperCase() + value.slice(1)} theme
                </span>
                <span aria-hidden="true">{value}</span>
              </label>
            ))}
          </fieldset>
          <p>Your records stay on this device.</p>
          <button
            type="button"
            className={s.mobileMenu}
            onClick={() => setMobile(false)}
          >
            Close navigation
          </button>
        </div>
      </aside>
      <div className={s.content}>
        <header className={s.topbar}>
          <button
            type="button"
            className={s.mobileMenu}
            aria-expanded={mobile}
            onClick={() => setMobile(!mobile)}
          >
            Pages
          </button>
          <span className={s.eyebrow}>A calmer way to run your day</span>
          <div className={s.actions}>
            <button
              type="button"
              data-workspace-trigger
              disabled={!state.ready}
              onClick={() => {
                window.dispatchEvent(
                  new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }),
                );
              }}
            >
              Search this device <kbd>Ctrl/Cmd K</kbd>
            </button>
            <button
              type="button"
              disabled={!state.ready}
              onClick={() => setTerminal(true)}
            >
              Command <kbd>Ctrl/Cmd J</kbd>
            </button>
          </div>
        </header>
        <main id="main-content" ref={main} tabIndex={-1}>
          <Suspense fallback={<p role="status">Opening this page.</p>}>
            {state.ready ? (
              views[displayPage]?.()
            ) : (
              <p role="status">Opening your local workspace.</p>
            )}
          </Suspense>
          {displayPage !== 'records' &&
            (state.error || state.issues.length > 0) && (
              <p role="alert" className={s.alert}>
                {state.error ||
                  `${state.issues.length} stored records could not be verified. Originals were kept unchanged.`}
              </p>
            )}
          <LocalWorkspace
            visible={displayPage === 'records'}
            onOpenModule={(record) => {
              const type = record.data.type;
              const mapping: Record<string, string> = {
                research: 'research',
                goal: 'goals',
                health: 'health',
                habit: 'habits',
                audio: 'audio',
                itinerary: 'itineraries',
                purchase: 'finance',
                scenario: 'finance',
                subscription: 'finance',
                receipt: 'receipts',
                event: 'calendar',
                grocery: 'food',
                pantry: 'food',
                place: 'transit',
                trail: 'outdoors',
                outing: 'outdoors',
                activity: 'outdoors',
                pet: 'pet',
                contact: 'contacts',
                screen: 'screen',
                reset: 'reset',
                news: 'reading',
              };
              navigate(mapping[type] ?? 'connections');
            }}
          />
          {storageWarning && (
            <p role="status">Your theme cannot be saved in this browser.</p>
          )}
        </main>
        <footer className={s.muted}>
          CATALYST · Local-first personal workspace
        </footer>
      </div>
      {terminal && !survey && (
        <Suspense fallback={<p role="status">Opening command bar.</p>}>
          <Terminal onClose={() => setTerminal(false)} />
        </Suspense>
      )}{' '}
      {survey && (
        <PurchaseSurvey
          key={survey.id}
          purchase={survey}
          onDone={() => setSurvey(null)}
        />
      )}
    </div>
  );
}
