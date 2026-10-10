import type { Profile } from '../../domain/product/profile';
export const chapters = [
  'Money & possibility',
  'Time & purpose',
  'Movement & reach',
  'Life & attention',
];
export const questions = [
  {
    id: 'cadence',
    chapter: 0,
    title: 'Give your income a rhythm.',
    description:
      'Choose when money arrives. Your projection follows real deposits, including months with an extra paycheck.',
    legacy: 0,
  },
  {
    id: 'pay',
    chapter: 0,
    title: 'What reaches your account?',
    description:
      'Use take-home pay for one cycle, after taxes. You can type shorthand such as 4.5k.',
    legacy: 1,
  },
  {
    id: 'deposit',
    chapter: 0,
    title: 'When does the next chapter begin?',
    description:
      'Anchor your income to the next deposit. Weekends do not move the date automatically.',
    legacy: 2,
  },
  {
    id: 'balance',
    chapter: 0,
    title: 'Start with what is available.',
    description:
      'Enter liquid cash and savings, excluding retirement and locked investments. The anchor date prevents old transactions being counted twice.',
    legacy: 3,
  },
  {
    id: 'overhead',
    chapter: 0,
    title: 'Make room for the essentials.',
    description:
      'Add monthly bills with their next due dates. Estimates affect the dotted projection. Leave subscriptions out here if they are already tracked in Finance.',
  },
  {
    id: 'buffer',
    chapter: 0,
    title: 'Keep a little breathing room.',
    description:
      'Choose the minimum balance you want the purchase scheduler to protect. Zero is a valid choice.',
  },
  {
    id: 'secondary',
    chapter: 0,
    title: 'Does income arrive another way?',
    description:
      'Add a side hustle, rent, dividends, or another recurring stream. Each gets its own amount and next deposit date.',
    legacy: 4,
  },
  {
    id: 'freelance',
    chapter: 0,
    title: 'Plan for the quieter months.',
    description:
      'A typical invoice, payment delay, and conservative low-month estimate give irregular income a range.',
    legacy: 5,
  },
  {
    id: 'persona',
    chapter: 1,
    title: 'What are you building toward?',
    description:
      'Your role sets the starting context for new task workspaces. You can change a task’s role at any time.',
  },
  {
    id: 'week',
    chapter: 1,
    title: 'Protect the hours that matter.',
    description:
      'Choose your working days and hours. Add split shifts where needed; unselected days stay quiet.',
    legacy: 6,
  },
  {
    id: 'zoom',
    chapter: 1,
    title: 'See time at your own scale.',
    description:
      'Choose the calendar view you want to open first. Zooming later keeps your focused date in place.',
  },
  {
    id: 'assets',
    chapter: 2,
    title: 'How can you get there?',
    description:
      'Select the transport you actually have available. A transit pass records access; the next questions choose acceptable routes.',
  },
  {
    id: 'walking',
    chapter: 2,
    title: 'How far feels comfortable?',
    description:
      'This is a hard limit for the walking portions of every route, including the walk to a station. Opt out to allow no walking.',
  },
  {
    id: 'transit',
    chapter: 2,
    title: 'Which routes belong in your day?',
    description:
      'Choose public transport you would use. Unselected modes are excluded from route recommendations.',
  },
  {
    id: 'diet',
    chapter: 3,
    title: 'Food that fits your life.',
    description:
      'Restrictions filter recipes and discovery. Unverified ingredients stay clearly marked; known conflicts are hidden.',
    legacy: 8,
  },
  {
    id: 'reading',
    chapter: 3,
    title: 'Choose what earns your attention.',
    description:
      'Search the source presets or add a publication name or link. Articles are added through local links and RSS imports.',
  },
  {
    id: 'topics',
    chapter: 3,
    title: 'Follow your curiosity.',
    description:
      'Choose topics for your digest and a morning review time. Nothing connects to an external account during setup.',
  },
  {
    id: 'outdoors',
    chapter: 3,
    title: 'Leave room for the outside.',
    description:
      'Choose activities and comfortable distance and elevation. These limits guide outing recommendations.',
    legacy: 10,
  },
  {
    id: 'pet',
    chapter: 3,
    title: 'A little care for your companion.',
    description:
      'Enable this only if you need it. Add your own care intervals and next dates; medical timing comes from your veterinarian.',
    legacy: 11,
  },
  {
    id: 'reset',
    chapter: 3,
    title: 'Choose your moment to reset.',
    description:
      'Set aside one day to clear your inbox, reconcile purchases, and align the week. Skipped questions return here.',
  },
  {
    id: 'review',
    chapter: 3,
    title: 'A foundation for what comes next.',
    description:
      'Review your answers and download their JSON state before opening your workspace. You can revise everything in Preferences.',
  },
];
export function surveyQuestions(profile: Profile) {
  return questions.filter(
    (q) => q.id !== 'freelance' || profile.pay.cadence === 'irregular',
  );
}
