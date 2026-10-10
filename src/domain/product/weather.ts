import { z } from 'zod';
export const hourWeatherSchema = z
  .object({
    hour: z.number().min(0).max(23),
    rain: z.boolean(),
    temperatureC: z.number().min(-60).max(60),
  })
  .strict();
export const forecastSchema = z
  .object({
    rain: z.boolean(),
    temperatureC: z.number().min(-60).max(60),
    sunsetHour: z.number().min(0).max(24),
    hourly: z.array(hourWeatherSchema).max(24).optional(),
  })
  .strict();
export type Forecast = z.infer<typeof forecastSchema>;
export function weatherAt(forecast: Forecast, hour: number) {
  const sample = [...(forecast.hourly ?? [])]
    .sort((a, b) => a.hour - b.hour)
    .filter((h) => h.hour <= hour)
    .at(-1);
  return {
    hour,
    rain: sample?.rain ?? forecast.rain,
    temperatureC: sample?.temperatureC ?? forecast.temperatureC,
  };
}
export function weatherWindow(forecast: Forecast, start: number, end: number) {
  const entries = Array.from(
    { length: Math.max(0, Math.ceil(end - start)) },
    (_, i) => weatherAt(forecast, start + i),
  );
  const best = entries
    .filter((h) => h.hour < forecast.sunsetHour)
    .sort(
      (a, b) =>
        Number(a.rain) * 30 +
        Math.abs(a.temperatureC - 18) -
        (Number(b.rain) * 30 + Math.abs(b.temperatureC - 18)),
    )[0]?.hour;
  return entries.map((h) => ({ ...h, best: h.hour === best }));
}
export function parseHourlyForecast(text: string) {
  return z
    .array(hourWeatherSchema)
    .max(24)
    .parse(
      text
        .trim()
        .split('\n')
        .filter(Boolean)
        .map((line) => {
          const [hour, temperature, rain] = line
            .split(',')
            .map((v) => v.trim());
          if (rain !== 'dry' && rain !== 'rain')
            throw new Error('Use hour, temperature Celsius, dry or rain.');
          return {
            hour: Number(hour),
            temperatureC: Number(temperature),
            rain: rain === 'rain',
          };
        }),
    );
}
