import { describe, expect, it } from 'vitest';
import { exportBackup, importBackup, MAX_BACKUP_BYTES } from './backup';
import { sampleRecords, sampleSettings } from '../fixtures/search';
import { openData } from '../test/data';

describe('validated portable backup boundary', () => {
  it('round-trips all record types and tombstones onto a new vault and undoes the import', async () => {
    const records = [...sampleRecords(), sampleSettings()];
    const first = records[0];
    if (!first) throw new Error('Missing fixture.');
    const original = [
      ...records,
      {
        ...first,
        id: '01K73PD500000000000000000Z',
        deletedAt: '2026-10-10T00:00:00Z',
      },
    ];
    const exported = exportBackup(original, '2026-10-10T12:00:00Z');
    expect(exported).toContain('Maria');
    expect(exported).not.toContain('CryptoKey');
    const backup = importBackup(exported);
    expect(backup.records).toEqual(original);
    const data = await openData();
    await data.bus.execute(
      'Import',
      backup.records.map((after) => ({ id: after.id, before: null, after })),
    );
    expect((await data.repository.readAll()).records).toEqual(
      [...original].sort((a, b) => a.id.localeCompare(b.id)),
    );
    await data.bus.undo();
    expect(
      (await data.repository.readAll()).records.every(
        (record) => record.deletedAt,
      ),
    ).toBe(true);
    await data.db.delete();
  });
  it('rejects oversized, malformed, future-version and duplicate-ID files before writing anything', () => {
    const text = exportBackup(sampleRecords(), '2026-10-10T12:00:00Z');
    for (const invalid of [
      '<script>alert(1)</script>',
      '{broken',
      'x'.repeat(MAX_BACKUP_BYTES + 1),
      text.replace('"version": 1', '"version": 99'),
      JSON.stringify({
        format: 'nexus-backup',
        version: 1,
        exportedAt: '2026-10-10T12:00:00Z',
        records: [sampleRecords()[0], sampleRecords()[0]],
      }),
      text.replace('"amountCents": -15025', '"amountCents": 0.5'),
    ])
      expect(() => importBackup(invalid)).toThrow();
  });
});
