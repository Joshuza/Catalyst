import { describe, it, expect } from 'vitest';
import { classify } from './classifier';
const work = [
  'Client brief due Friday',
  'History assignment rubric',
  'Repository pull request',
  'Deliverable review',
  'Slack project handoff',
  'Deadline this week',
  'Submit the proposal',
  'Finish report by Wednesday',
  'Design review at ten',
  'Team report attached',
  'Client invoice query',
  'Rubric grading criteria',
  'Due date changed',
  'Assignment notes',
  'Repository build failed',
  'Pull request needs changes',
  'Please deliver the draft',
  'Project proposal',
  'Team meeting agenda',
  'Code handoff meeting',
];
const personal = [
  'Lunch tomorrow?',
  'Family photos',
  'How are you?',
  'Coffee on Sunday',
  'Birthday plans',
  'Can you call me?',
  'See you soon',
  'Dinner at my place',
  'Weekend hike',
  'Thanks for visiting',
  'Your friend says hello',
  'Movie tonight',
  'New home address',
  'Checking in',
  'Missed your call',
  'Travel pictures',
  'Congratulations',
  'Can we chat?',
  'Happy birthday',
  'Lunch location',
];
const promo = [
  '50% off this week',
  'Summer sale',
  'Newsletter digest',
  'Discount inside',
  'Unsubscribe preferences',
  'Shopping promotion',
  'Sale ends tonight',
  'Member discount',
  'Newsletter roundup',
  'Promotion for members',
  '25% off accessories',
  'Flash sale',
  'Weekly newsletter',
  'Discount code',
  'Seasonal sale',
  'Unsubscribe here',
  'Newsletter: shopping',
  '60% off today',
  'Subscriber promotion',
  'Exclusive discount',
];
describe('INB-01: a representative 60-message local classifier set', () => {
  it('classifies at least 90 percent while keeping marketing quiet', () => {
    const cases = [
      ...work.map((title) => ({ title, expected: 'work' })),
      ...personal.map((title) => ({ title, expected: 'personal' })),
      ...promo.map((title) => ({ title, expected: 'promotional' })),
    ];
    const correct = cases.filter(
      (c) => classify('Sample sender', c.title, '', []) === c.expected,
    ).length;
    expect(cases).toHaveLength(60);
    expect(correct / cases.length).toBeGreaterThanOrEqual(0.9);
    expect(
      promo.every(
        (title) => classify('Sample store', title, '', []) === 'promotional',
      ),
    ).toBe(true);
  });
  it('prefers an explicit trusted-contact or twice-corrected sender decision to generic content', () => {
    expect(classify('Sam', 'Newsletter', '', [], ['Sam'])).toBe('personal');
    expect(
      classify('sam', 'Sale', '', [
        { type: 'rule', sender: 'Sam', stream: 'work', corrections: 2 },
      ]),
    ).toBe('work');
  });
});
