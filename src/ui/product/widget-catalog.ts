import { navigation } from './navigation';
import { navigate } from './state';
import type { WidgetId } from '../../domain/product/widgets';

export const widgetCatalog = navigation.flatMap((group) =>
  group.links.map(([id, label]) => ({
    id: id as WidgetId,
    label: label!,
    group: group.group,
  })),
);
export const widgetLabel = (id: string) =>
  widgetCatalog.find((entry) => entry.id === id)?.label ?? 'Widget';
export const widgetRoute = (id: WidgetId) =>
  id === 'briefing' ? 'briefing-detail' : id;
let returnTarget: { id: WidgetId; top: number } | null = null;
export function openWidget(id: WidgetId) {
  returnTarget = { id, top: window.scrollY };
  navigate(widgetRoute(id));
}
export function restoreWidgetFocus() {
  if (!returnTarget) return;
  const target = returnTarget;
  returnTarget = null;
  requestAnimationFrame(() => {
    document
      .querySelector<HTMLElement>(`[data-widget-id="${target.id}"] button`)
      ?.focus({ preventScroll: true });
    window.scrollTo({ top: target.top, behavior: 'instant' });
  });
}
