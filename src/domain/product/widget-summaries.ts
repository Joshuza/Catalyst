import type { UserRecord, Transaction } from '../records';
import type { Profile } from './profile';
import type { ModuleData } from './entities';
import type { WidgetId } from './widgets';
import { daysBetween } from './dates';
import { project } from './finance';
import { dietaryCheck } from './food';
import { personalizedReading } from './reading-preferences';

export type WidgetSummary = { value: string; detail: string; cents?: number };
type Module = Extract<UserRecord, { kind: 'module' }>;
function ofType<T extends ModuleData['type']>(records: UserRecord[], type: T) {
  return records.filter(
    (r): r is Module & { data: Extract<ModuleData, { type: T }> } =>
      r.kind === 'module' && r.data.type === type,
  );
}
function count(value: number, singular: string, plural = `${singular}s`) {
  return `${value} ${value === 1 ? singular : plural}`;
}
/** Each summary reads verified local records; it never creates sample content. */
export function summarizeWidgets(
  records: UserRecord[],
  profile: Profile,
  today: string,
  deep: boolean,
): Record<WidgetId, WidgetSummary> {
  const active = records.filter((r) => !r.deletedAt);
  const modules = <T extends ModuleData['type']>(type: T) =>
    ofType(active, type);
  const tasks = active.filter((r) => r.kind === 'task' && !r.completed);
  const messages = active.filter(
    (r) =>
      r.kind === 'message' &&
      r.unread &&
      !r.archived &&
      (!deep || r.stream !== 'promotional'),
  );
  const events = modules('event')
    .filter((r) => r.data.date >= today)
    .sort(
      (a, b) =>
        a.data.date.localeCompare(b.data.date) || a.data.start - b.data.start,
    );
  const news = personalizedReading(modules('news'), today, profile).filter(
    (r) => !r.data.read,
  );
  const receipts = modules('receipt');
  const groceries = modules('grocery').filter(
    (r) => !r.data.checked && r.data.quantity > 0,
  );
  const recipes = active.filter(
    (r) => r.kind === 'recipe' && dietaryCheck(r, profile.dietary).allowed,
  );
  const outings = modules('outing').filter((r) => r.data.date >= today);
  const health = modules('health').filter((r) => !r.data.completed);
  const habits = modules('habit');
  const contacts = modules('contact');
  const contactDue = contacts.filter(
    (r) => daysBetween(r.data.lastContact, today) >= r.data.rhythmDays,
  );
  const pet = modules('pet').filter((r) => !r.data.completed);
  const screen = modules('screen')
    .filter((r) => r.data.date <= today)
    .sort((a, b) => b.data.date.localeCompare(a.data.date))[0];
  const reset = modules('reset').sort((a, b) =>
    b.data.date.localeCompare(a.data.date),
  )[0];
  const research = modules('research');
  const trips = modules('itinerary').filter((r) => r.data.endDate >= today);
  let finance: WidgetSummary = {
    value: 'Review settings',
    detail: 'Financial inputs need review before a balance can be shown.',
  };
  try {
    const point = project(
      profile,
      today,
      1,
      modules('purchase').map((r) => r.data),
      active.filter((r): r is Transaction => r.kind === 'transaction'),
      'Main',
      modules('subscription').map((r) => r.data),
    )[0];
    if (point)
      finance = {
        value: 'Available now',
        cents: point.actual,
        detail: count(
          modules('purchase').filter(
            (r) =>
              r.data.status === 'planned' &&
              r.data.scenario === 'Main' &&
              (!r.data.currency || r.data.currency === profile.currency),
          ).length,
          'planned purchase',
        ),
      };
  } catch {
    /* Keep an explicit review state instead of inventing a balance. */
  }
  return {
    briefing: {
      value: count(
        events.filter((r) => r.data.date === today).length,
        'plan today',
        'plans today',
      ),
      detail: 'Your money, schedule and messages in one focused review.',
    },
    create: {
      value: 'A place for a thought',
      detail: 'Capture a purchase, task, event, note or research idea.',
    },
    calendar: {
      value: count(events.length, 'upcoming event'),
      detail: events[0]
        ? `${events[0].data.date} · ${events[0].title}`
        : 'Your next commitment will appear here.',
    },
    inbox: {
      value: count(messages.length, 'unread message'),
      detail: deep
        ? 'Promotions are quiet while you focus.'
        : 'Work, personal and promotional streams, kept separate.',
    },
    tasks: {
      value: count(tasks.length, 'open task'),
      detail:
        tasks[0]?.title ?? 'Add a deliverable and break it into small steps.',
    },
    reading: deep
      ? {
          value: 'Paused for focus',
          detail: 'Your saved reading will be here when you return.',
        }
      : {
          value: count(news.length, 'unread article'),
          detail:
            news[0]?.title ?? 'Save an article or import a followed feed.',
        },
    goals: {
      value: count(modules('goal').length, 'savings goal'),
      detail: 'Keep your next milestone in view.',
    },
    itineraries: {
      value: count(trips.length, 'upcoming trip'),
      detail:
        trips[0]?.title ?? 'Plans, travel times and original tickets together.',
    },
    finance,
    receipts: {
      value: count(receipts.length, 'saved receipt'),
      detail: `${count(receipts.filter((r) => !r.data.accepted).length, 'match')} awaiting review.`,
    },
    food: {
      value: count(groceries.length, 'grocery item'),
      detail: `${count(recipes.length, 'recipe')} in your dietary-filtered library.`,
    },
    transit: {
      value: count(modules('place').length, 'saved place'),
      detail: 'Compare your saved routes against mobility preferences.',
    },
    outdoors: {
      value: count(outings.length, 'planned outing'),
      detail:
        outings[0]?.title ?? 'Find room for an outing that fits your week.',
    },
    health: {
      value: count(health.length, 'care reminder'),
      detail: health[0]?.title ?? 'Keep checkups and refills in one place.',
    },
    habits: {
      value: `${habits.filter((r) => r.data.dates.includes(today)).length} of ${habits.length} today`,
      detail: 'Small routines, one check-in at a time.',
    },
    audio: {
      value: count(
        modules('audio').filter((r) => !r.data.played).length,
        'saved listen',
      ),
      detail: 'Podcasts and music for the moment you are in.',
    },
    contacts: {
      value: count(contactDue.length, 'check-in due', 'check-ins due'),
      detail: `${count(contacts.length, 'person', 'people')} in your circle.`,
    },
    pet: {
      value: count(pet.length, 'care reminder'),
      detail: profile.petName
        ? `Care for ${profile.petName}.`
        : 'Vet, food and care dates in one place.',
    },
    screen: {
      value: screen ? `${screen.data.hours} hours` : 'No check-in yet',
      detail: screen
        ? `Last recorded ${screen.data.date}.`
        : 'Import or enter screen time to see your pattern.',
    },
    reset: {
      value: reset
        ? `${reset.data.steps.length} of 3 reviewed`
        : 'A fresh week',
      detail: reset
        ? `Last review ${reset.data.date}.`
        : 'Inbox, money and next week, one screen at a time.',
    },
    research: {
      value: count(research.length, 'saved idea'),
      detail: research[0]?.title ?? 'Save the things you want to come back to.',
    },
    records: {
      value: count(active.filter((r) => r.kind === 'note').length, 'note'),
      detail: 'Your notes, records and local backup tools.',
    },
    profile: {
      value: profile.completed ? 'Made for you' : 'Finish your setup',
      detail: 'Pay dates, working week and personal preferences.',
    },
    connections: {
      value: 'On this device',
      detail: 'Manage local imports, available adapters and privacy.',
    },
  };
}
