import { describe, expect, it } from 'vitest';
import { openData } from '../test/data';
import { sampleRecords } from '../fixtures/search';

describe('UX-05: command inverse patches and history', () => {
  for (const kind of ['note', 'transaction']) {
    it(`undoes and redoes create, edit, and soft delete of a ${kind}`, async () => {
      const data = await openData();
      const record = sampleRecords().find((value) => value.kind === kind);
      if (!record) throw new Error('Missing fixture.');
      const created = await data.bus.execute('Create', [
        { id: record.id, before: null, after: record },
      ]);
      expect(created.state).toEqual([record]);
      expect(created.inverse[0]?.after.deletedAt).not.toBeNull();
      await data.bus.undo();
      expect((await data.repository.get(record.id))?.deletedAt).not.toBeNull();
      await data.bus.redo();
      expect(await data.repository.get(record.id)).toEqual(record);
      const edited = { ...record, title: 'Edited record' };
      await data.bus.execute('Edit', [
        { id: record.id, before: record, after: edited },
      ]);
      await data.bus.undo();
      expect((await data.repository.get(record.id))?.title).toBe(record.title);
      await data.bus.redo();
      expect((await data.repository.get(record.id))?.title).toBe(
        'Edited record',
      );
      const deleted = { ...edited, deletedAt: data.clock.now().toISOString() };
      await data.bus.execute('Delete', [
        { id: record.id, before: edited, after: deleted },
      ]);
      await data.bus.undo();
      expect((await data.repository.get(record.id))?.deletedAt).toBeNull();
      await data.bus.redo();
      expect((await data.repository.get(record.id))?.deletedAt).not.toBeNull();
      expect(await data.db.records.count()).toBe(1);
      await data.db.delete();
    });
  }
  it('rejects stale and duplicate patches atomically and keeps failed commands out of history', async () => {
    const data = await openData();
    const [first, second] = sampleRecords();
    if (!first || !second) throw new Error('Missing fixtures.');
    await data.bus.execute('Create', [
      { id: first.id, before: null, after: first },
    ]);
    await expect(
      data.bus.execute('Partial invalid batch', [
        { id: second.id, before: null, after: second },
        { id: first.id, before: null, after: first },
      ]),
    ).rejects.toThrow('changed');
    expect(await data.repository.get(second.id)).toBeNull();
    await expect(
      data.bus.execute('Duplicate', [
        { id: first.id, before: first, after: first },
        { id: first.id, before: first, after: first },
      ]),
    ).rejects.toThrow('duplicate');
    await data.bus.undo();
    expect((await data.repository.get(first.id))?.deletedAt).not.toBeNull();
    await data.bus.execute('New create', [
      { id: second.id, before: null, after: second },
    ]);
    expect(data.bus.canRedo).toBe(false);
    await data.db.delete();
  });
  it('undoes an atomic sample batch without deleting a user record', async () => {
    const data = await openData();
    const records = sampleRecords();
    await data.bus.execute(
      'Samples',
      records.map((after) => ({ id: after.id, before: null, after })),
    );
    const first = records[0];
    if (!first) throw new Error('Missing fixture.');
    const personal = {
      ...first,
      id: '01K73PD500000000000000000Z',
      sampleSet: null,
      title: 'My note',
    };
    await data.repository.apply([
      { id: personal.id, before: null, after: personal },
    ]);
    await data.bus.undo();
    expect(
      (await data.repository.readAll()).records.filter(
        (record) => !record.deletedAt,
      ),
    ).toEqual([personal]);
    await data.db.delete();
  });
});
