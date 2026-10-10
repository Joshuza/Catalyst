import type { Clock } from '../domain/clock';
import { createUlidGenerator } from '../domain/id';
import { recordSchema, type UserRecord } from '../domain/records';
import {
  defaultProfile,
  emptyTaskDetails,
  type ModuleData,
} from '../domain/product/model';
import { today, addDays } from '../domain/product/dates';
export function productSamples(clock: Clock): UserRecord[] {
  const date = today(clock),
    now = clock.now().toISOString(),
    id = createUlidGenerator(clock, (n) => new Uint8Array(n).fill(7));
  const base = () => ({
    id: id(),
    createdAt: now,
    updatedAt: now,
    schemaVersion: 1,
    deletedAt: null,
    sampleSet: 'product-tour',
  });
  const module = (title: string, data: ModuleData) =>
    recordSchema.parse({
      ...base(),
      kind: 'module',
      title: `Sample: ${title}`,
      data,
    });
  const profile = {
    ...defaultProfile(date),
    completed: true,
    pay: {
      name: 'Sample salary',
      amountCents: 450000,
      cadence: 'biweekly' as const,
      nextDate: addDays(date, 3),
    },
    savingsCents: 1200000,
    modes: ['train', 'bicycle', 'walk'] as const,
    dietary: ['Gluten-Free'] as const,
    activities: ['Hike', 'Bike ride', 'Run'] as const,
    feeds: ['Sample field notes'],
  };
  const settings = recordSchema.parse({
    ...base(),
    kind: 'settings',
    title: 'Sample: profile',
    locale: 'en-US',
    currency: 'USD',
    profile: {
      ...profile,
      modes: [...profile.modes],
      dietary: [...profile.dietary],
      activities: [...profile.activities],
    },
  });
  const task = recordSchema.parse({
    ...base(),
    kind: 'task',
    title: 'Sample: history essay',
    notes: 'Keep the outline focused on the industrial revolution.',
    completed: false,
    details: {
      ...emptyTaskDetails(),
      role: 'student',
      deadline: addDays(date, 7),
      rubric:
        'Use five sources, a clear argument, and a documented conclusion.',
      resources: [
        { title: 'Reference library', url: 'https://example.com/library' },
      ],
    },
  });
  return [
    settings,
    task,
    module('Camera lens', {
      type: 'purchase',
      costCents: 30000,
      date: addDays(date, 7),
      status: 'planned',
      scenario: 'Main',
      actualCents: null,
      regret: null,
      emotion: null,
      transactionId: null,
    }),
    module('Music trial', {
      type: 'subscription',
      amountCents: 1599,
      cadence: 'monthly',
      nextDate: addDays(date, 1),
      trialEnd: addDays(date, 1),
      billingUrl: 'https://example.com/billing',
    }),
    module('Design review', {
      type: 'event',
      date,
      start: 10,
      minutes: 60,
      category: 'work',
      taskId: null,
      travelMinutes: 12,
      location: 'Sample studio',
      ticket: 'none',
      reference: '',
    }),
    module('Train reminder', {
      type: 'event',
      date: addDays(date, 1),
      start: 8.25,
      minutes: 30,
      category: 'travel',
      taskId: null,
      travelMinutes: 0,
      location: 'Sample Central → Sample West',
      ticket: 'train',
      reference: 'SAMPLE-ONLY',
    }),
    recordSchema.parse({
      ...base(),
      kind: 'recipe',
      title: 'Sample: lentil & rice bowl',
      ingredients: ['rice', 'lentils', 'carrot'],
      details: {
        servings: 4,
        ingredients: [
          {
            name: 'rice',
            quantity: 200,
            unit: 'g',
            section: 'Pantry',
            restrictions: [],
          },
          {
            name: 'lentils',
            quantity: 300,
            unit: 'g',
            section: 'Pantry',
            restrictions: [],
          },
          {
            name: 'carrot',
            quantity: 2,
            unit: 'item',
            section: 'Produce',
            restrictions: [],
          },
        ],
        instructions: 'Cook rice and lentils. Roast the carrots and combine.',
        source: '',
        verified: ['Gluten-Free', 'Vegan'],
      },
    }),
    module('Rice in pantry', {
      type: 'pantry',
      name: 'rice',
      quantity: 100,
      unit: 'g',
    }),
    module('Garden bakery', {
      type: 'place',
      address: 'Sample Main Street',
      dietary: ['Gluten-Free', 'Vegan'],
      routes: [
        { mode: 'train', minutes: 12, walkingMiles: 0.3, distanceMiles: 2.1 },
        { mode: 'bicycle', minutes: 14, walkingMiles: 0, distanceMiles: 2.1 },
        { mode: 'walk', minutes: 38, walkingMiles: 2.1, distanceMiles: 2.1 },
      ],
    }),
    module('Ridge loop', {
      type: 'trail',
      address: 'Sample trailhead',
      dietary: [],
      routes: [
        { mode: 'train', minutes: 30, walkingMiles: 0.4, distanceMiles: 10 },
        { mode: 'car', minutes: 45, walkingMiles: 0, distanceMiles: 10 },
      ],
      distanceMiles: 5.4,
      elevationFeet: 900,
      minutes: 160,
      difficulty: 'Moderate',
      loop: true,
      dogFriendly: true,
      activity: 'Hike',
      elevation: [0, 250, 600, 900, 650, 300, 0],
    }),
    module('Maria', {
      type: 'contact',
      email: '',
      birthday: null,
      rhythmDays: 30,
      lastContact: addDays(date, -35),
      trusted: true,
      gifts: 'A book about local trails.',
      logs: [],
    }),
    module('Field notes for a quieter week', {
      type: 'news',
      source: 'Sample field notes',
      url: 'https://example.com/field-notes',
      date,
      minutes: 4,
      read: false,
      muted: false,
      pausedUntil: null,
    }),
    module('Weekend ride', {
      type: 'activity',
      date: addDays(date, -2),
      activity: 'Bike ride',
      miles: 5.4,
      elevationFeet: 200,
    }),
  ];
}
