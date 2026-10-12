export const navigation = [
  {
    group: 'Your day',
    links: [
      ['briefing', 'Briefing', '◈'],
      ['create', 'Add new', '+'],
      ['calendar', 'Calendar', '▦'],
      ['inbox', 'Inbox', '≡'],
      ['tasks', 'Tasks', '✓'],
      ['reading', 'Reading', '▤'],
    ],
  },
  {
    group: 'Money & plans',
    links: [
      ['goals', 'Savings goals', '◎'],
      ['itineraries', 'Itineraries & tickets', '⇢'],
      ['finance', 'Financial Core', '$'],
      ['receipts', 'Receipts & reports', '↧'],
      ['food', 'Recipes & groceries', '◇'],
      ['transit', 'Discovery & transit', '↗'],
      ['outdoors', 'Outdoors & activities', '△'],
    ],
  },
  {
    group: 'Life & rhythm',
    links: [
      ['health', 'Health & care', '+'],
      ['habits', 'Habits & streaks', '◉'],
      ['audio', 'Listen', '♫'],
      ['contacts', 'People & relationships', '○'],
      ['pet', 'Pet Tracker', '♧'],
      ['screen', 'Screen time', '◷'],
      ['reset', 'Weekly reset', '↺'],
    ],
  },
  {
    group: 'Your workspace',
    links: [
      ['research', 'Research vault', '▧'],
      ['records', 'Notes & records', '▣'],
      ['profile', 'Profile & preferences', '⚙'],
      ['connections', 'Connections & privacy', '⌁'],
    ],
  },
];
export const allPages = new Set(
  navigation.flatMap((g) => g.links.map((l) => l[0])),
);
