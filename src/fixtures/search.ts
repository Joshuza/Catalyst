import { createUlidGenerator } from '../domain/id';
import { FixedClock } from '../domain/clock';
import { recordSchema, type UserRecord } from '../domain/records';

export const SAMPLE_SET = 'phase-1-search';
export function sampleSettings(): UserRecord {
  return recordSchema.parse({
    id: '01M4G8HMG0000000000000000Z',
    kind: 'settings',
    createdAt: '2026-10-09T12:00:00Z',
    updatedAt: '2026-10-09T12:00:00Z',
    schemaVersion: 1,
    deletedAt: null,
    sampleSet: SAMPLE_SET,
    title: 'Sample: settings',
    locale: 'en-US',
    currency: 'USD',
  });
}
export function sampleRecords(): UserRecord[] {
  const clock = new FixedClock('2026-10-09T12:00:00Z');
  const id = createUlidGenerator(clock, (length) => new Uint8Array(length));
  const base = () => ({
    id: id(),
    createdAt: clock.now().toISOString(),
    updatedAt: clock.now().toISOString(),
    schemaVersion: 1,
    deletedAt: null,
    sampleSet: SAMPLE_SET,
  });
  return [
    {
      ...base(),
      kind: 'note',
      title: 'Sample: research notes',
      body: 'Ideas for a quiet workspace.',
    },
    {
      ...base(),
      kind: 'task',
      title: 'Sample: review draft',
      notes: 'Read the draft and collect comments.',
      completed: false,
    },
    {
      ...base(),
      kind: 'transaction',
      title: 'Sample: equipment invoice',
      amountCents: -15025,
      currency: 'USD',
      date: '2026-10-09',
      category: 'Equipment',
      receiptFile: 'sample-receipt.pdf',
    },
    {
      ...base(),
      kind: 'transaction',
      title: 'Sample: small receipt',
      amountCents: -5000,
      currency: 'USD',
      date: '2026-10-05',
      category: 'Supplies',
      receiptFile: 'sample-small.pdf',
    },
    {
      ...base(),
      kind: 'transaction',
      title: 'Sample: September receipt',
      amountCents: -20000,
      currency: 'USD',
      date: '2026-09-05',
      category: 'Supplies',
      receiptFile: 'sample-september.pdf',
    },
    {
      ...base(),
      kind: 'message',
      title: 'Sample: draft feedback',
      body: 'Could you review the draft?',
      sender: 'Maria',
      unread: true,
      date: '2026-10-08',
      stream: 'personal',
    },
    {
      ...base(),
      kind: 'message',
      title: 'Sample: archive feedback',
      body: 'The previous draft is filed.',
      sender: 'Maria',
      unread: false,
      date: '2026-09-08',
      stream: 'personal',
    },
    {
      ...base(),
      kind: 'message',
      title: 'Sample: promotional update',
      body: 'A sample newsletter.',
      sender: 'Sample newsletter',
      unread: true,
      date: '2026-10-08',
      stream: 'promotional',
    },
    {
      ...base(),
      kind: 'recipe',
      title: 'Sample: lentil bowl',
      ingredients: ['lentils', 'rice', 'carrot'],
    },
  ].map((record) => recordSchema.parse(record));
}
