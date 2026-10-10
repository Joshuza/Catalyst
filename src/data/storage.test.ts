import { describe, expect, it } from 'vitest';
import Dexie from 'dexie';
import { openData, testCrypto, testName } from '../test/data';
import { sampleRecords } from '../fixtures/search';
import { NexusDatabase } from './database';
import { WebCryptoVault, VaultError } from './vault';
import { recordSchema } from '../domain/records';

describe('UX-07: durable validated local storage and AES-GCM vault', () => {
  it('encrypts transaction/message fields, keeps the key non-extractable, and reopens without losing records', async () => {
    const name = testName();
    const data = await openData(name);
    const records = sampleRecords();
    await data.repository.apply(
      records.map((after) => ({ id: after.id, before: null, after })),
    );
    const encrypted = await data.db.records
      .where('kind')
      .anyOf(['transaction', 'message'])
      .toArray();
    const serialized = JSON.stringify(encrypted);
    for (const text of [
      'equipment invoice',
      '15025',
      'Maria',
      'draft feedback',
      'sample-receipt.pdf',
    ])
      expect(serialized).not.toContain(text);
    expect((await data.db.keys.get('device'))?.key.extractable).toBe(false);
    const key = (await data.db.keys.get('device'))?.key;
    if (!key) throw new Error('Missing key.');
    await expect(testCrypto.subtle.exportKey('raw', key)).rejects.toThrow();
    data.db.close();
    const reopened = await openData(name);
    expect((await reopened.repository.readAll()).records).toEqual(records);
    await reopened.db.delete();
  });
  it('detects ciphertext tampering, context swaps and bad metadata without removing the original row', async () => {
    const data = await openData();
    const [record] = sampleRecords().filter(
      (value) => value.kind === 'transaction',
    );
    if (!record) throw new Error('Missing transaction.');
    await data.repository.apply([
      { id: record.id, before: null, after: record },
    ]);
    const row = await data.db.records.get(record.id);
    if (!row || row.value.storage !== 'encrypted')
      throw new Error('Missing encryption.');
    const cipher = row.value.fields.title;
    if (!cipher) throw new Error('Missing field.');
    await expect(
      data.vault.decrypt(cipher, 'wrong-record'),
    ).rejects.toBeInstanceOf(VaultError);
    const damaged = {
      ...row,
      value: {
        ...row.value,
        fields: {
          ...row.value.fields,
          title: {
            ...cipher,
            data: `${cipher.data[0] === 'A' ? 'B' : 'A'}${cipher.data.slice(1)}`,
          },
        },
      },
    };
    await data.db.records.put(damaged);
    const loaded = await data.repository.readAll();
    expect(loaded.records).toEqual([]);
    expect(loaded.issues).toHaveLength(1);
    expect(await data.db.records.get(record.id)).toEqual(damaged);
    await expect(data.repository.get(record.id)).rejects.toBeInstanceOf(
      VaultError,
    );
    await data.db.records.put({
      ...row,
      value: { ...row.value, deletedAt: '2026-10-10T00:00:00Z' },
    });
    expect((await data.repository.readAll()).issues).toHaveLength(1);
    await data.db.delete();
  });
  it('never silently replaces a missing key while encrypted records exist', async () => {
    const data = await openData();
    const record = sampleRecords()[2];
    if (!record) throw new Error('Missing fixture.');
    await data.repository.apply([
      { id: record.id, before: null, after: record },
    ]);
    await data.db.keys.delete('device');
    await expect(
      new WebCryptoVault(data.db, testCrypto).initialize(),
    ).rejects.toThrow('key is missing');
    expect(await data.db.keys.count()).toBe(0);
    expect(await data.db.records.count()).toBe(1);
    expect((await data.repository.readAll()).issues).toHaveLength(1);
    await data.db.delete();
  });
  it('validates reads and writes, rejects plaintext sensitive records, and caps the persisted shapes', async () => {
    const data = await openData();
    const record = sampleRecords()[2];
    if (!record) throw new Error('Missing fixture.');
    const invalid = { ...record, amountCents: 1.5 };
    await expect(
      data.repository.apply([{ id: invalid.id, before: null, after: invalid }]),
    ).rejects.toThrow();
    await data.db.records.put({
      id: record.id,
      kind: record.kind,
      value: { storage: 'plain', record },
    });
    expect((await data.repository.readAll()).issues).toHaveLength(1);
    expect(
      recordSchema.safeParse({ ...record, schemaVersion: 999 }).success,
    ).toBe(false);
    await data.db.delete();
  });
});

describe('forward-only migration snapshot', () => {
  it('preserves encrypted fields and their device key through an upgrade', async () => {
    const source = await openData();
    const fixture = sampleRecords()[2];
    if (!fixture) throw new Error('Missing transaction.');
    const record = { ...fixture, sampleSet: null };
    await source.repository.apply([
      { id: record.id, before: null, after: record },
    ]);
    const row = await source.db.records.get(record.id);
    const key = await source.db.keys.get('device');
    if (!row || !key || row.value.storage !== 'encrypted')
      throw new Error('Missing encrypted source.');
    Reflect.deleteProperty(row.value, 'sampleSet');
    const name = testName();
    const legacy = new Dexie(name);
    legacy
      .version(1)
      .stores({ records: '&id, kind', keys: '&id', metadata: '&id' });
    await legacy.open();
    await legacy.table('records').put(row);
    await legacy.table('keys').put(key);
    legacy.close();
    const migrated = await openData(name);
    expect(await migrated.repository.get(record.id)).toEqual(record);
    expect((await migrated.db.keys.get('device'))?.key.extractable).toBe(false);
    expect(await migrated.db.metadata.get('migration-1-to-2')).toBeDefined();
    await source.db.delete();
    await migrated.db.delete();
  });
  it('preserves the pre-migration export before adding sample provenance to a version-1 database', async () => {
    const name = testName();
    const legacy = new Dexie(name);
    legacy
      .version(1)
      .stores({ records: '&id, kind', keys: '&id', metadata: '&id' });
    await legacy.open();
    const record = sampleRecords()[0];
    if (!record) throw new Error('Missing note.');
    const previous = { ...record };
    Reflect.deleteProperty(previous, 'sampleSet');
    const row = {
      id: record.id,
      kind: record.kind,
      value: { storage: 'plain', record: previous },
    };
    await legacy.table('records').put(row);
    legacy.close();
    const db = new NexusDatabase(name);
    await db.open();
    const snapshot = await db.metadata.get('migration-1-to-2');
    expect(snapshot?.value).toEqual({
      from: 1,
      to: 2,
      records: [row],
      keys: [],
    });
    expect((await db.records.get(record.id))?.value).toEqual({
      storage: 'plain',
      record: { ...previous, sampleSet: null },
    });
    expect(db.verno).toBe(2);
    await db.delete();
  });
});
