import { useState } from 'react';
import {
  type Forecast,
  parseHourlyForecast,
} from '../../domain/product/weather';
import {
  modeSchema,
  dietaryTags,
  type DataOf,
} from '../../domain/product/model';
import { Field, ToggleSet } from './Common';
import { workspace } from '../local/runtime';
import { run } from './state';
import s from './product.module.css';
export function ForecastFields({
  value,
  onChange,
}: {
  value: Forecast;
  onChange: (value: Forecast) => void;
}) {
  const [hourly, setHourly] = useState(''),
    [error, setError] = useState('');
  return (
    <fieldset>
      <legend>Manual forecast</legend>
      <label>
        <input
          type="checkbox"
          checked={value.rain}
          onChange={(e) => onChange({ ...value, rain: e.target.checked })}
        />
        Rain expected
      </label>
      <div className={s.pair}>
        <Field label="Temperature Celsius">
          <input
            type="number"
            min="-60"
            max="60"
            value={value.temperatureC}
            onChange={(e) =>
              onChange({ ...value, temperatureC: Number(e.target.value) })
            }
          />
        </Field>
        <Field label="Sunset hour">
          <input
            type="number"
            min="0"
            max="24"
            step=".5"
            value={value.sunsetHour}
            onChange={(e) =>
              onChange({ ...value, sunsetHour: Number(e.target.value) })
            }
          />
        </Field>
      </div>
      <details>
        <summary>Hourly forecast</summary>
        <Field label="Hourly weather: hour, Celsius, dry or rain">
          <textarea
            value={hourly}
            onChange={(e) => setHourly(e.target.value)}
            placeholder="8, 18, dry"
          />
        </Field>
        <button
          type="button"
          onClick={() => {
            try {
              onChange({ ...value, hourly: parseHourlyForecast(hourly) });
              setError('');
            } catch (err) {
              setError(
                err instanceof Error
                  ? err.message
                  : 'Check the hourly forecast.',
              );
            }
          }}
        >
          Apply hourly forecast
        </button>
        {error && <p role="alert">{error}</p>}
      </details>
      <p className={s.muted}>
        Enter a forecast from your source. Without hourly values, temperature
        and rain are assumed uniform through the day.
      </p>
    </fieldset>
  );
}
export function RouteFields({
  routes,
  onChange,
}: {
  routes: DataOf<'place'>['routes'];
  onChange: (routes: DataOf<'place'>['routes']) => void;
}) {
  return (
    <div>
      {routes.map((r, i) => (
        <div className={s.panel} key={i}>
          <Field label="Travel mode">
            <select
              value={r.mode}
              onChange={(e) =>
                onChange(
                  routes.map((v, j) =>
                    j === i
                      ? { ...v, mode: e.target.value as typeof r.mode }
                      : v,
                  ),
                )
              }
            >
              {modeSchema.options.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </Field>
          <div className={s.pair}>
            <Field label="Route minutes">
              <input
                type="number"
                min="1"
                value={r.minutes}
                onChange={(e) =>
                  onChange(
                    routes.map((v, j) =>
                      j === i ? { ...v, minutes: Number(e.target.value) } : v,
                    ),
                  )
                }
              />
            </Field>
            <Field label="Required walking miles">
              <input
                type="number"
                min="0"
                step=".1"
                value={r.walkingMiles}
                onChange={(e) =>
                  onChange(
                    routes.map((v, j) =>
                      j === i
                        ? { ...v, walkingMiles: Number(e.target.value) }
                        : v,
                    ),
                  )
                }
              />
            </Field>
          </div>
          <button
            type="button"
            onClick={() => onChange(routes.filter((_, j) => j !== i))}
          >
            Remove route
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange([
            ...routes,
            { mode: 'train', minutes: 15, walkingMiles: 0.2, distanceMiles: 1 },
          ])
        }
      >
        Add route option
      </button>
    </div>
  );
}
export function VenueForm() {
  const [title, setTitle] = useState(''),
    [address, setAddress] = useState(''),
    [dietary, setDietary] = useState<string[]>([]),
    [routes, setRoutes] = useState<DataOf<'place'>['routes']>([]);
  return (
    <details>
      <summary>Add manual venue</summary>
      <div className={s.form}>
        <Field label="Venue name">
          <input
            value={title}
            maxLength={300}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Field>
        <Field label="Venue address">
          <input
            value={address}
            maxLength={300}
            onChange={(e) => setAddress(e.target.value)}
          />
        </Field>
        <ToggleSet
          label="Verified dietary options"
          options={[...dietaryTags]}
          values={dietary}
          onChange={setDietary}
        />
        <RouteFields routes={routes} onChange={setRoutes} />
        <button
          type="button"
          disabled={!title.trim() || !routes.length}
          onClick={() =>
            run(
              workspace
                .save(
                  workspace.make(title, {
                    type: 'place',
                    address,
                    dietary: dietary as DataOf<'place'>['dietary'],
                    routes,
                  }),
                )
                .then(() => {
                  setTitle('');
                  setRoutes([]);
                }),
            )
          }
        >
          Save venue
        </button>
      </div>
    </details>
  );
}
