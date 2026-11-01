import { describe, expect, it } from 'vitest';
import {
  widgetIds,
  defaultWidgetLayout,
  widgetLayout,
  widgetLayoutSchema,
  resizeWidget,
} from '../domain/product/widgets';
import { summarizeWidgets } from '../domain/product/widget-summaries';
import { moduleSchema } from '../domain/product/entities';
import { defaultProfile } from '../domain/product/profile';
import { navigation } from '../ui/product/navigation';
import { productSamples } from '../fixtures/product';
import { FixedClock } from '../domain/clock';
import type { Transaction } from '../domain/records';
import { openData } from './data';
const today = '2026-10-10';
const clock = new FixedClock(`${today}T12:00:00Z`);
const profile = () => ({ ...defaultProfile(today), savingsCents: 100000 });
const prefs = () => ({
  type: 'briefing' as const,
  lastVisit: today,
  deepWork: false,
  activeTask: '',
  hidden: [],
  pinned: [],
  expanded: [],
});

describe('UX widget coverage, summaries and saved layouts', () => {
  it('provides a summary for every menu module and keeps defaults to six mixed-size widgets', () => {
    expect(
      new Set(
        navigation.flatMap((group) => group.links.map((entry) => entry[0])),
      ),
    ).toEqual(new Set(widgetIds));
    const summaries = summarizeWidgets([], profile(), today, false);
    expect(Object.keys(summaries).sort()).toEqual([...widgetIds].sort());
    expect(defaultWidgetLayout).toHaveLength(6);
    expect(new Set(defaultWidgetLayout.map((item) => item.size))).toEqual(
      new Set(['small', 'medium', 'large']),
    );
    expect(summaries.tasks.value).toBe('0 open tasks');
    expect(summaries.calendar.value).toBe('0 upcoming events');
  });
  it('accepts legacy briefing records and rejects duplicate, unknown, oversized or invalid widget layouts', () => {
    expect(moduleSchema.parse(prefs())).toEqual(prefs());
    expect(
      widgetLayoutSchema.safeParse([{ id: 'tasks', size: 'giant' }]).success,
    ).toBe(false);
    expect(
      widgetLayoutSchema.safeParse([{ id: 'unknown', size: 'small' }]).success,
    ).toBe(false);
    expect(
      widgetLayoutSchema.safeParse([
        ...defaultWidgetLayout,
        defaultWidgetLayout[0],
      ]).success,
    ).toBe(false);
    expect(
      widgetLayoutSchema.safeParse(
        Array.from({ length: 25 }, () => ({ id: 'tasks', size: 'small' })),
      ).success,
    ).toBe(false);
  });
  it('resizes without mutating a layout and keeps disabled pet widgets out of the visible layout', () => {
    const before = JSON.stringify(defaultWidgetLayout);
    const next = resizeWidget(defaultWidgetLayout, 'tasks', 'large');
    expect(next.find((item) => item.id === 'tasks')?.size).toBe('large');
    expect(JSON.stringify(defaultWidgetLayout)).toBe(before);
    const withPet = resizeWidget(next, 'pet', 'small');
    expect(widgetLayout(withPet, false).some((item) => item.id === 'pet')).toBe(
      false,
    );
    expect(widgetLayout(withPet, true).some((item) => item.id === 'pet')).toBe(
      true,
    );
  });
  it('summarizes only live records, respects diet and focus filters, and never invents a connected account', () => {
    const records = productSamples(clock);
    const ordinary = summarizeWidgets(records, profile(), today, false);
    expect(ordinary.tasks.value).toBe('1 open task');
    expect(ordinary.food.detail).toContain('1 recipe');
    const filtered = summarizeWidgets(
      records,
      { ...profile(), dietary: ['Keto'] },
      today,
      true,
    );
    expect(filtered.food.detail).toContain('0 recipes');
    expect(filtered.reading.value).toBe('Paused for focus');
    expect(filtered.connections.value).toBe('On this device');
    expect(
      summarizeWidgets(
        records.map((r) => ({ ...r, deletedAt: clock.now().toISOString() })),
        profile(),
        today,
        false,
      ).tasks.value,
    ).toBe('0 open tasks');
  });
  it('shows verified money without applying planned purchases or other currencies to actual cash', () => {
    const records = productSamples(clock);
    const base = records[0]!;
    const transaction: Transaction = {
      id: base.id,
      createdAt: base.createdAt,
      updatedAt: base.updatedAt,
      schemaVersion: 1,
      deletedAt: null,
      sampleSet: null,
      kind: 'transaction',
      title: 'Sample: cleared expense',
      amountCents: -20000,
      currency: 'USD',
      date: today,
      category: 'Purchase',
      receiptFile: null,
    };
    const before = JSON.stringify(records);
    expect(
      summarizeWidgets(records, profile(), today, false).finance.cents,
    ).toBe(100000);
    expect(
      summarizeWidgets([...records, transaction], profile(), today, false)
        .finance.cents,
    ).toBe(80000);
    expect(
      summarizeWidgets(
        [...records, { ...transaction, currency: 'EUR' }],
        profile(),
        today,
        false,
      ).finance.cents,
    ).toBe(100000);
    expect(JSON.stringify(records)).toBe(before);
  });
  it('stores widget choices encrypted through the existing command bus and can undo them', async () => {
    const data = await openData();
    const original = productSamples(clock)[0]!;
    const record = {
      id: original.id,
      createdAt: original.createdAt,
      updatedAt: original.updatedAt,
      schemaVersion: 1 as const,
      deletedAt: null,
      sampleSet: null,
      kind: 'module' as const,
      title: 'Sample: dashboard layout',
      data: { ...prefs(), widgetLayout: defaultWidgetLayout },
    };
    await data.bus.execute('Save dashboard layout', [
      { id: record.id, before: null, after: record },
    ]);
    expect(JSON.stringify(await data.db.records.toArray())).not.toContain(
      'widgetLayout',
    );
    const loaded = await data.repository.readAll();
    expect(loaded.issues).toEqual([]);
    expect(loaded.records[0]).toEqual(record);
    await data.bus.undo();
    expect(
      (await data.repository.readAll()).records[0]?.deletedAt,
    ).not.toBeNull();
    await data.db.delete();
  });
});
