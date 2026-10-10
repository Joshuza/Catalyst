import { describe, it, expect } from 'vitest';
import { openData } from './data';
import { productSamples } from '../fixtures/product';
import { FixedClock } from '../domain/clock';
import { exportBackup, importBackup } from '../data/backup';
import { CommandBus } from '../engine/commands';
const clock = new FixedClock('2026-10-10T12:00:00Z');
describe('UX-05 / UX-07: encrypted product state and compatible backups', () => {
  it('encrypts profiles, purchases, contact logs and receipts; undo survives atomic linked records', async () => {
    const data = await openData(),
      records = productSamples(clock);
    const bus = new CommandBus(data.repository, clock);
    await bus.execute(
      'Sample product',
      records.map((after) => ({ id: after.id, before: null, after })),
    );
    const serialized = JSON.stringify(await data.db.records.toArray());
    for (const privateText of [
      'Maria Chen',
      '450000',
      '1200000',
      'Garden bakery',
      'biweekly',
    ])
      expect(serialized).not.toContain(privateText);
    const loaded = await data.repository.readAll();
    expect(loaded.issues).toEqual([]);
    expect(loaded.records).toEqual(records);
    const text = exportBackup(loaded.records, clock.now().toISOString());
    const target = await openData();
    await target.repository.apply(
      importBackup(text).records.map((after) => ({
        id: after.id,
        before: null,
        after,
      })),
    );
    expect((await target.repository.readAll()).records).toEqual(records);
    await bus.undo();
    expect(
      (await data.repository.readAll()).records.every((r) => !!r.deletedAt),
    ).toBe(true);
    await bus.redo();
    expect((await data.repository.readAll()).records).toEqual(records);
    await data.db.delete();
    await target.db.delete();
  });
  it('rejects plaintext profiles and module payloads without removing the original data', async () => {
    const data = await openData();
    const records = productSamples(clock).filter(
      (r) => r.kind === 'settings' || r.kind === 'module',
    );
    for (const record of records)
      await data.db.records.put({
        id: record.id,
        kind: record.kind,
        value: { storage: 'plain', record },
      });
    const loaded = await data.repository.readAll();
    expect(loaded.records).toHaveLength(0);
    expect(loaded.issues).toHaveLength(records.length);
    expect(await data.db.records.count()).toBe(records.length);
    await data.db.delete();
  });
});

it('encrypts Gemini research images, reservations, health notes and itinerary details in durable storage', async () => {
  const data = await openData();
  const base = productSamples(clock).find((r) => r.kind === 'module');
  if (!base || base.kind !== 'module')
    throw new Error('Missing fixture metadata');
  const records = [
    {
      ...base,
      id: base.id.slice(0, -1) + 'A',
      title: 'Private clinic',
      data: {
        type: 'health' as const,
        date: '2026-10-10',
        category: 'Dental' as const,
        notes: 'PRIVATE-HEALTH',
        completed: false,
        repeatMonths: 0,
        eventId: null,
      },
    },
    {
      ...base,
      id: base.id.slice(0, -1) + 'B',
      title: 'Private goal',
      data: {
        type: 'goal' as const,
        date: '2026-10-10',
        currency: 'USD',
        targetCents: 123456,
        reservedCents: 65432,
      },
    },
    {
      ...base,
      id: base.id.slice(0, -1) + 'C',
      title: 'Private research',
      data: {
        type: 'research' as const,
        url: '',
        body: 'PRIVATE-RESEARCH',
        image: 'data:image/png;base64,aGVsbG8=',
        tags: [],
        priority: 'Researching' as const,
        pros: '',
        cons: '',
        costCents: 0,
        purchaseId: null,
      },
    },
    {
      ...base,
      id: base.id.slice(0, -1) + 'D',
      title: 'Private trip',
      data: {
        type: 'itinerary' as const,
        startDate: '2026-10-10',
        endDate: '2026-10-11',
        eventIds: [],
        notes: 'PRIVATE-ITINERARY',
      },
    },
  ];
  await data.repository.apply(
    records.map((after) => ({ id: after.id, before: null, after })),
  );
  const raw = JSON.stringify(await data.db.records.toArray());
  for (const text of [
    'PRIVATE-HEALTH',
    '123456',
    '65432',
    'PRIVATE-RESEARCH',
    'aGVsbG8',
    'PRIVATE-ITINERARY',
  ])
    expect(raw).not.toContain(text);
  expect((await data.repository.readAll()).records).toEqual(records);
  await data.db.delete();
});
