import { describe, expect, it } from 'vitest';
import { parseCommand } from './terminal';
import { defaultProfile } from '../../domain/product/model';
import { classify } from './classifier';
import { briefingSections } from './briefing';
const p = defaultProfile('2026-10-10');
describe('TERM / INB / BRF: deterministic intent and context', () => {
  it('parses every required example sentence verbatim', () => {
    expect(
      parseCommand('buy keyboard $150 on 11/20', '2026-10-10', p),
    ).toMatchObject({
      intent: 'purchase',
      title: 'keyboard',
      cents: 15000,
      date: '2026-11-20',
    });
    const ambiguous = parseCommand(
      'reminder client call next Thursday at 3pm',
      '2026-10-10',
      p,
    );
    expect(ambiguous.question).toContain('Which date');
    expect(
      parseCommand(
        'reminder client call next Thursday at 3pm',
        '2026-10-10',
        p,
        '2026-10-15',
      ),
    ).toMatchObject({ intent: 'event', hour: 15, date: '2026-10-15' });
    expect(
      parseCommand('reminder dentist on Friday', '2026-10-10', p),
    ).toMatchObject({
      intent: 'event',
      date: '2026-10-16',
    });
    expect(
      parseCommand('lunch with Sam tomorrow at noon', '2026-10-10', p),
    ).toMatchObject({
      intent: 'event',
      date: '2026-10-11',
      hour: 12,
    });
    expect(
      parseCommand('finish report by Wednesday', '2026-10-10', p),
    ).toMatchObject({
      intent: 'task',
      date: '2026-10-14',
    });
  });
  it('recognizes bought and wanted purchases, missing dates/amounts and protected after-work timing', () => {
    expect(
      parseCommand('I bought headphones $200 today', '2026-10-10', p).bought,
    ).toBe(true);
    expect(
      parseCommand('I want to buy keyboard $150 tomorrow', '2026-10-10', p)
        .intent,
    ).toBe('purchase');
    expect(
      parseCommand('buy keyboard tomorrow', '2026-10-10', p).question,
    ).toBe('What is the purchase cost?');
    expect(
      parseCommand('buy keyboard $150', '2026-10-10', p).question,
    ).toContain('date');
    expect(
      parseCommand('reminder groceries on Monday after work', '2026-10-10', p)
        .hour,
    ).toBe(17);
  });
  it('treats fines as planned costs until the user explicitly records payment', () => {
    expect(
      parseCommand('parking ticket $45 due Tuesday', '2026-10-10', p),
    ).toMatchObject({
      intent: 'purchase',
      title: 'parking ticket',
      cents: 4500,
      date: '2026-10-13',
      bought: false,
    });
    expect(
      parseCommand('I paid parking ticket $45 today', '2026-10-10', p),
    ).toMatchObject({
      intent: 'purchase',
      title: 'parking ticket',
      bought: true,
    });
  });
  it('learns the two-correction rule and keeps promotions quiet', () => {
    const rule = {
      type: 'rule' as const,
      sender: 'Newsletter',
      stream: 'personal' as const,
      corrections: 2,
    };
    expect(classify('Newsletter', '50% off', 'Unsubscribe', [rule])).toBe(
      'personal',
    );
    expect(classify('Repo', 'Pull request', 'Review by Friday', [])).toBe(
      'work',
    );
    expect(classify('Shop', '50% off', 'Unsubscribe', [])).toBe('promotional');
  });
  it('covers 24 contexts and never hides pinned briefing sections', () => {
    for (const weekend of [false, true])
      for (const deepWork of [false, true])
        for (const urgent of [false, true])
          for (const daysAway of [0, 3, 10]) {
            const result = briefingSections({
              weekend,
              deepWork,
              urgent,
              daysAway,
              pinned: ['reading'],
              hidden: ['reading', 'inbox'],
            });
            expect(result).toContain('reading');
            expect(result).not.toContain('inbox');
            if (urgent) expect(result).toContain('sentinel');
            if (deepWork) expect(result).not.toContain('outdoors');
            if (daysAway >= 3) expect(result).toContain('catchup');
          }
  });
});
