import { useSyncExternalStore, useState, useEffect } from 'react';
import { workspace } from '../local/runtime';
import type { ModuleData, DataOf } from '../../domain/product/model';
import type { UserRecord } from '../../domain/records';
import { today } from '../../domain/product/dates';
export type Entity<T extends ModuleData['type']> = Extract<
  UserRecord,
  { kind: 'module' }
> & {
  data: DataOf<T>;
};
export function entities<T extends ModuleData['type']>(type: T): Entity<T>[] {
  return workspace
    .visible('module')
    .filter((r) => r.kind === 'module' && r.data.type === type) as Entity<T>[];
}
export function useProduct() {
  const state = useSyncExternalStore(
    workspace.subscribe,
    workspace.getSnapshot,
  );
  const [, setTick] = useState(0);
  const date = today(workspace.clock);
  useEffect(() => {
    const timer = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(timer);
  }, []);
  const override = state.records
    .filter(
      (r): r is Entity<'override'> =>
        r.kind === 'module' &&
        !r.deletedAt &&
        r.data.type === 'override' &&
        r.data.until >= date,
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  const profile = override
    ? {
        ...workspace.profile,
        modes: override.data.modes,
        shifts: override.data.shifts,
      }
    : workspace.profile;
  const prefs = entities('briefing')[0],
    focus = entities('event').find((e) => e.id === prefs?.data.focusEventId),
    hour =
      workspace.clock.now().getHours() +
      workspace.clock.now().getMinutes() / 60;
  const deep =
    !!prefs?.data.deepWork &&
    (!focus ||
      (focus.data.date === date &&
        focus.data.start + focus.data.minutes / 60 > hour));
  return {
    ...state,
    profile,
    deep,
    baseProfile: workspace.profile,
    today: date,
  };
}
export function saveEntity<T extends ModuleData['type']>(
  entity: Entity<T>,
  patch: Partial<DataOf<T>>,
) {
  return workspace.save({ ...entity, data: { ...entity.data, ...patch } });
}
export function run(promise: Promise<unknown>) {
  void promise.catch(() => undefined);
}
export function money(cents: number, currency = workspace.profile.currency) {
  return new Intl.NumberFormat(workspace.locale, {
    style: 'currency',
    currency,
  }).format(cents / 100);
}
export function navigate(page: string) {
  window.dispatchEvent(new CustomEvent('nexus:navigate', { detail: page }));
}

let pendingCalendarDate: string | null = null;
export function focusCalendar(date: string) {
  pendingCalendarDate = date;
  window.dispatchEvent(
    new CustomEvent('nexus:calendar-date', { detail: date }),
  );
  navigate('calendar');
}
export function takeCalendarDate(fallback: string) {
  const value = pendingCalendarDate ?? fallback;
  pendingCalendarDate = null;
  return value;
}
