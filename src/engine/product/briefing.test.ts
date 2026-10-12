import { describe, expect, it } from 'vitest';
import { briefingSections, compactBriefing } from './briefing';
describe('BRF / UX: quieter briefing', () => {
  it('keeps urgent signals and pinned reading visible while optional sections wait for disclosure', () => {
    const all = briefingSections({
      weekend: true,
      deepWork: false,
      urgent: true,
      daysAway: 4,
      pinned: ['reading'],
      hidden: [],
    });
    const quiet = compactBriefing(all, ['reading'], false);
    expect(quiet).toEqual([
      'reading',
      'catchup',
      'sentinel',
      'finance',
      'schedule',
      'inbox',
    ]);
    expect(compactBriefing(all, ['reading'], true)).toEqual(all);
    expect(all).toContain('outdoors');
    expect(all).toContain('reset');
  });
  it('retains focus suppression and never resurrects a deliberately hidden section', () => {
    const all = briefingSections({
      weekend: false,
      deepWork: true,
      urgent: false,
      daysAway: 0,
      pinned: ['tasks'],
      hidden: ['finance'],
    });
    expect(compactBriefing(all, ['tasks'], false)).toEqual([
      'tasks',
      'schedule',
      'inbox',
    ]);
    expect(compactBriefing(all, ['tasks'], true)).not.toContain('reading');
    expect(compactBriefing(all, ['tasks'], true)).not.toContain('finance');
  });
});
