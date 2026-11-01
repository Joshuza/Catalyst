import { describe, expect, it } from 'vitest';
import { moduleSchema } from '../domain/product/entities';
import {
  widgetLayoutSchema,
  defaultWidgetLayout,
} from '../domain/product/widgets';
import { exportBackup, importBackup } from '../data/backup';
import { openData } from './data';
import { productSamples } from '../fixtures/product';

const preferences = {
  type: 'briefing' as const,
  lastVisit: '2026-10-10',
  deepWork: false,
  activeTask: '',
  hidden: ['reading'],
  pinned: ['finance'],
  expanded: ['finance'],
};

describe('Rollback: saved workspace compatibility', () => {
  it('accepts original preferences and retains valid layout metadata without enabling widget UI', () => {
    expect(moduleSchema.parse(preferences)).toEqual(preferences);
    const saved = { ...preferences, widgetLayout: defaultWidgetLayout };
    expect(moduleSchema.parse(saved)).toEqual(saved);
    expect(
      importBackup(exportBackup([], '2026-10-10T12:00:00Z')).records,
    ).toEqual([]);
  });

  it('still rejects malformed, duplicate, unknown and oversized saved layouts', () => {
    for (const layout of [
      [{ id: 'tasks', size: 'giant' }],
      [{ id: 'unknown', size: 'small' }],
      [...defaultWidgetLayout, defaultWidgetLayout[0]],
      Array.from({ length: 25 }, () => ({ id: 'tasks', size: 'small' })),
    ]) {
      expect(widgetLayoutSchema.safeParse(layout).success).toBe(false);
      expect(
        moduleSchema.safeParse({ ...preferences, widgetLayout: layout })
          .success,
      ).toBe(false);
    }
  });

  it('keeps encrypted widget-era preferences readable, editable, undoable and exportable after reload', async () => {
    const data = await openData();
    const original = productSamples(data.clock)[0]!;
    const record = {
      id: original.id,
      createdAt: original.createdAt,
      updatedAt: original.updatedAt,
      schemaVersion: 1 as const,
      deletedAt: null,
      sampleSet: null,
      kind: 'module' as const,
      title: 'Sample: existing dashboard preferences',
      data: { ...preferences, widgetLayout: defaultWidgetLayout },
    };
    try {
      await data.bus.execute('Save preferences', [
        { id: record.id, before: null, after: record },
      ]);
      expect(JSON.stringify(await data.db.records.toArray())).not.toContain(
        'widgetLayout',
      );
      data.db.close();
      await data.db.open();
      const loaded = await data.repository.readAll();
      expect(loaded.issues).toEqual([]);
      expect(loaded.records).toEqual([record]);
      const changed = { ...record, data: { ...record.data, deepWork: true } };
      await data.bus.execute('Edit previous dashboard preferences', [
        { id: record.id, before: record, after: changed },
      ]);
      expect(await data.repository.get(record.id)).toEqual(changed);
      const exported = exportBackup(
        (await data.repository.readAll()).records,
        data.clock.now().toISOString(),
      );
      expect(importBackup(exported).records).toEqual([changed]);
      await data.bus.undo();
      expect(await data.repository.get(record.id)).toEqual(record);
    } finally {
      await data.db.delete();
    }
  });
});
