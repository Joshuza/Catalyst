import type { Profile, DataOf } from './model';
import { addDays, weekday, daysBetween } from './dates';
export type Slot = { date: string; start: number; minutes: number };
export function overlap(a: Slot, b: Slot): boolean {
  return (
    a.date === b.date &&
    a.start < b.start + b.minutes / 60 &&
    b.start < a.start + a.minutes / 60
  );
}
export function protectedTime(p: Profile, slot: Slot): boolean {
  return p.shifts.some(
    (s) =>
      s.day === weekday(slot.date) &&
      slot.start < s.end &&
      slot.start + slot.minutes / 60 > s.start,
  );
}
export function availableSlots(
  profile: Profile,
  start: string,
  end: string,
  events: DataOf<'event'>[],
  minutes = 30,
  spacing = minutes,
  earliestHour = 0,
): Slot[] {
  const slots: Slot[] = [];
  const count = Math.min(366, Math.max(0, daysBetween(start, end) + 1));
  for (let i = 0; i < count; i++) {
    const date = addDays(start, i);
    for (const shift of profile.shifts.filter((s) => s.day === weekday(date))) {
      for (
        let h =
          date === start
            ? Math.max(shift.start, Math.ceil(earliestHour * 4) / 4)
            : shift.start;
        h + minutes / 60 <= shift.end;
        h += spacing / 60
      ) {
        const slot = { date, start: h, minutes };
        if (
          !events.some((e) =>
            overlap(slot, {
              ...e,
              start: e.start - e.travelMinutes / 60,
              minutes: e.minutes + e.travelMinutes,
            }),
          )
        )
          slots.push(slot);
      }
    }
  }
  return [...new Map(slots.map((s) => [`${s.date}-${s.start}`, s])).values()];
}
export function workingHours(
  profile: Profile,
  start: string,
  deadline: string,
  events: DataOf<'event'>[],
  earliestHour = 0,
): number {
  return availableSlots(
    profile,
    start,
    deadline,
    events,
    30,
    30,
    earliestHour,
  ).reduce((sum, s) => sum + s.minutes / 60, 0);
}
export function planSteps(
  profile: Profile,
  start: string,
  deadline: string,
  steps: { title: string; minutes: number }[],
  events: DataOf<'event'>[],
  earliestHour = 0,
): Slot[] | null {
  const planned: Slot[] = [];
  for (const step of steps) {
    const slot = availableSlots(
      profile,
      start,
      deadline,
      [
        ...events,
        ...planned.map((s) => ({
          ...s,
          type: 'event' as const,
          category: 'work' as const,
          taskId: null,
          minutes: s.minutes + 15,
          travelMinutes: 0,
          location: '',
          ticket: 'none' as const,
          reference: '',
        })),
      ],
      step.minutes + 15,
      15,
      earliestHour,
    )[0];
    if (!slot) return null;
    planned.push({ ...slot, minutes: step.minutes });
  }
  return planned;
}
export function freeWindow(
  date: string,
  start: number,
  end: number,
  events: DataOf<'event'>[],
): boolean {
  return (
    end > start &&
    !events.some((e) =>
      overlap(
        { date, start, minutes: (end - start) * 60 },
        {
          ...e,
          start: e.start - e.travelMinutes / 60,
          minutes: e.minutes + e.travelMinutes,
        },
      ),
    )
  );
}
export function personalSlot(
  profile: Profile,
  date: string,
  events: DataOf<'event'>[],
  preferred = 18,
  minutes = 60,
): Slot | null {
  const slots = Array.from({ length: 96 }, (_, i) => ({
    date,
    start: i / 4,
    minutes,
  })).filter(
    (slot) =>
      slot.start + minutes / 60 <= 24 &&
      !protectedTime(profile, slot) &&
      !events.some((e) =>
        overlap(slot, {
          ...e,
          start: e.start - e.travelMinutes / 60,
          minutes: e.minutes + e.travelMinutes,
        }),
      ),
  );
  slots.sort(
    (a, b) =>
      Math.abs(a.start - preferred) - Math.abs(b.start - preferred) ||
      a.start - b.start,
  );
  return slots[0] ?? null;
}
