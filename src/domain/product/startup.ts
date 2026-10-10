import { profileSchema, type Profile } from './profile';
import { project } from './finance';
import { addMonths, daysBetween } from './dates';
import type { Transaction } from '../records';
import type { DataOf } from './model';

export const INITIALIZATION_MS = 3000;
export function surveyResponses(input: Profile): Profile {
  const profile = profileSchema.parse(input);
  return {
    ...profile,
    persona: profile.persona ?? 'hybrid',
    calendarZoom: profile.calendarZoom ?? 'week',
    fixedExpenses: profile.fixedExpenses ?? [],
    safetyBufferCents: profile.safetyBufferCents ?? 0,
    transitPass: profile.transitPass ?? false,
    cycleKind: profile.cycleKind ?? 'bicycle',
    mediaTopics: profile.mediaTopics ?? [],
    digestTime: profile.digestTime ?? '07:00',
    petVetMonths: profile.petVetMonths ?? 12,
    petFoodDays: profile.petFoodDays ?? 30,
    petNextVet: profile.petNextVet ?? null,
    petNextFood: profile.petNextFood ?? null,
  };
}
export function workingHourMask(profile: Profile) {
  return Array.from({ length: 7 }, (_, day) =>
    Array.from({ length: 48 }, (_, slot) =>
      profile.shifts.some(
        (s) => s.day === day && slot / 2 >= s.start && slot / 2 < s.end,
      ),
    ),
  );
}
export function preferenceRules(profile: Profile) {
  return {
    news: {
      sources: [...profile.feeds],
      topics: [...(profile.mediaTopics ?? [])],
      digestTime: profile.digestTime ?? '07:00',
      sourceMode: 'local-import' as const,
    },
    transit: {
      modes: profile.modes.filter(
        (m) => m !== 'walk' || profile.walkingMiles > 0,
      ),
      maximumWalkingMiles: profile.walkingMiles,
      walkingEnabled: profile.walkingMiles > 0,
      hasTransitPass: profile.transitPass ?? false,
      cycleKind: profile.cycleKind ?? 'bicycle',
    },
    pet: profile.petEnabled
      ? {
          name: profile.petName,
          species: profile.petSpecies,
          vetIntervalMonths: profile.petVetMonths ?? 12,
          foodIntervalDays: profile.petFoodDays ?? 30,
          nextVet: profile.petNextVet ?? null,
          nextFood: profile.petNextFood ?? null,
        }
      : null,
  };
}
export function initializeProfile(
  input: Profile,
  today: string,
  purchases: DataOf<'purchase'>[] = [],
  transactions: Transaction[] = [],
  subscriptions: DataOf<'subscription'>[] = [],
) {
  const profile = profileSchema.parse(input);
  return {
    financial: project(
      profile,
      today,
      daysBetween(today, addMonths(today, 12)),
      purchases,
      transactions,
      'Main',
      subscriptions,
    ),
    workingHours: workingHourMask(profile),
    rules: preferenceRules(profile),
    calendarZoom: profile.calendarZoom ?? 'week',
    persona: profile.persona ?? 'hybrid',
  };
}
export function surveyJson(profile: Profile) {
  return JSON.stringify(
    {
      format: 'nexus-survey',
      version: 1,
      responses: surveyResponses(profile),
    },
    null,
    2,
  );
}
