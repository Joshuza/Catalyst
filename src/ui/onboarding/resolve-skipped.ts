import type { Profile } from '../../domain/product/profile';
import { questions } from './steps';
export function resolvedSurveyQuestions(before: Profile, after: Profile) {
  const values = (p: Profile): Record<string, unknown> => ({
    cadence: [p.pay.cadence, p.semiDays],
    pay: [p.pay.amountCents, p.currency],
    deposit: p.pay.nextDate,
    balance: [p.savingsCents, p.balanceDate, p.overdraft],
    overhead: p.fixedExpenses,
    buffer: p.safetyBufferCents,
    secondary: p.streams,
    freelance: [p.invoiceCents, p.delayDays, p.lowMonthCents],
    persona: p.persona,
    week: p.shifts,
    zoom: p.calendarZoom,
    assets: [
      p.modes.filter((m) => ['car', 'bicycle', 'walk'].includes(m)),
      p.transitPass,
      p.cycleKind,
    ],
    walking: [p.walkingMiles, p.distanceUnit],
    transit: p.modes.filter((m) => !['car', 'bicycle', 'walk'].includes(m)),
    diet: p.dietary,
    reading: p.feeds,
    topics: [p.mediaTopics, p.digestTime],
    outdoors: [p.activities, p.distanceTolerance, p.elevationTolerance],
    pet: [
      p.petEnabled,
      p.petName,
      p.petSpecies,
      p.petBirthdate,
      p.petVetMonths,
      p.petFoodDays,
      p.petNextVet,
      p.petNextFood,
    ],
    reset: p.resetDay,
  });
  const old = values(before),
    next = values(after);
  return questions
    .filter((q) => JSON.stringify(old[q.id]) !== JSON.stringify(next[q.id]))
    .map((q) => q.title);
}
