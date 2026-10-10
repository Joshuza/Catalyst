import type { Profile, DataOf, Mode } from './model';
export type { Forecast } from './weather';
import { weatherAt, weatherWindow, type Forecast } from './weather';
export type RouteOption = {
  mode: Mode;
  minutes: number;
  walkingMiles: number;
  distanceMiles: number;
  departure: number;
  arrival: number;
  warning: string;
};
export function routeOptions(
  profile: Profile,
  routes: DataOf<'place'>['routes'],
  departure: number,
  weather: Forecast,
  nextStart = 24,
  visitMinutes = 0,
): RouteOption[] {
  return routes
    .filter(
      (r) =>
        profile.modes.includes(r.mode) &&
        r.walkingMiles <= profile.walkingMiles &&
        (profile.walkingMiles > 0 || r.walkingMiles === 0),
    )
    .map((r) => {
      const exposed = r.mode === 'walk' || r.mode === 'bicycle';
      const current = weatherAt(weather, departure);
      const rain = exposed && current.rain;
      const start = departure - (rain ? 1 / 6 : 0),
        arrival = start + r.minutes / 60;
      return {
        ...r,
        departure: start,
        arrival,
        warning: rain
          ? 'Rain forecast; leave 10 minutes earlier.'
          : exposed && (current.temperatureC > 32 || current.temperatureC < 0)
            ? 'Extreme temperature; consider another mode.'
            : '',
      };
    })
    .filter(
      (r) =>
        r.departure >= 0 &&
        r.arrival + (visitMinutes + r.minutes) / 60 <= nextStart,
    )
    .sort((a, b) => a.minutes - b.minutes || a.mode.localeCompare(b.mode));
}
export function rankTrail(
  profile: Profile,
  trail: DataOf<'trail'>,
  windowMinutes: number,
  departure: number,
  forecast: Forecast,
  nextStart = 24,
  dogOnly = false,
): {
  score: number;
  route: RouteOption;
  backBy: number;
  reasons: string[];
} | null {
  if (
    !profile.activities.includes(trail.activity) ||
    trail.distanceMiles > profile.distanceTolerance ||
    trail.elevationFeet > profile.elevationTolerance ||
    (dogOnly && !trail.dogFriendly)
  )
    return null;
  const options = routeOptions(
    profile,
    trail.routes,
    departure,
    forecast,
    nextStart,
    trail.minutes,
  );
  const route = options[0];
  if (!route) return null;
  const backBy =
    route.departure + (route.minutes * 2 + trail.minutes + 30) / 60;
  if (
    dogOnly &&
    weatherWindow(forecast, route.departure, backBy).some(
      (h) => h.temperatureC >= 29,
    )
  )
    return null;
  if (
    backBy > nextStart ||
    backBy > forecast.sunsetHour - 0.5 ||
    route.minutes * 2 + trail.minutes + 30 > windowMinutes
  )
    return null;
  const carFree = !profile.modes.includes('car');
  const transit = ['train', 'subway', 'bus', 'ferry'].includes(route.mode);
  return {
    score: Math.round(
      Math.max(
        0,
        100 -
          (trail.distanceMiles / profile.distanceTolerance) * 12 -
          (trail.elevationFeet / Math.max(1, profile.elevationTolerance)) * 10 -
          route.minutes / 20 -
          { Easy: 0, Moderate: 6, Hard: 14 }[trail.difficulty] +
          (carFree && transit ? 10 : 0),
      ),
    ),
    route,
    backBy,
    reasons: [
      `${route.mode} access within your walking limit`,
      route.warning || 'Fits your weather window',
      `Return before sunset with a 30-minute margin`,
    ],
  };
}
