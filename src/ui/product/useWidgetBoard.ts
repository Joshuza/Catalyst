import { useMemo } from 'react';
import {
  widgetLayout,
  defaultWidgetLayout,
  resizeWidget,
  sectionForWidget,
  type WidgetId,
  type WidgetSize,
} from '../../domain/product/widgets';
import { summarizeWidgets } from '../../domain/product/widget-summaries';
import { workspace } from '../local/runtime';
import { entities, useProduct, run } from './state';

export function useWidgetBoard() {
  const { records, profile, today, deep, busy } = useProduct();
  const preferences = entities('briefing')[0];
  const layout = widgetLayout(
    preferences?.data.widgetLayout,
    profile.petEnabled,
  );
  const summaries = useMemo(
    () => summarizeWidgets(records, profile, today, deep),
    [records, profile, today, deep],
  );
  const sizeOf = (id: WidgetId) =>
    layout.find((item) => item.id === id)?.size ?? 'medium';
  function update(id: WidgetId, size?: WidgetSize, remove = false) {
    if (busy) return;
    const data = preferences?.data ?? {
      type: 'briefing' as const,
      lastVisit: today,
      deepWork: false,
      activeTask: '',
      hidden: [],
      pinned: [],
      expanded: [],
    };
    const section = sectionForWidget[id];
    if (remove && data.pinned.includes(section ?? id)) return;
    const current = data.widgetLayout ?? defaultWidgetLayout;
    const next = remove
      ? current.filter((item) => item.id !== id)
      : resizeWidget(current, id, size ?? sizeOf(id));
    const hidden = section
      ? remove
        ? [...new Set([...data.hidden, section])]
        : data.hidden.filter((v) => v !== section)
      : data.hidden;
    const after = { ...data, widgetLayout: next, hidden };
    run(
      workspace.save(
        preferences
          ? { ...preferences, data: after }
          : workspace.make('Your dashboard', after),
      ),
    );
  }
  const active = (id: WidgetId) => {
    const section = sectionForWidget[id];
    if (preferences?.data.pinned.includes(section ?? id)) return true;
    return section
      ? !preferences?.data.hidden.includes(section) ||
          !!preferences?.data.pinned.includes(section)
      : layout.some((item) => item.id === id);
  };
  const locked = (id: WidgetId) =>
    !!preferences?.data.pinned.includes(sectionForWidget[id] ?? id);
  return {
    busy,
    sample: records.some((record) => !record.deletedAt && !!record.sampleSet),
    locked,
    layout,
    summaries,
    sizeOf,
    update,
    active,
    petEnabled: profile.petEnabled,
    deep,
  };
}
