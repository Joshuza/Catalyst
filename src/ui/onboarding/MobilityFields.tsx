import { useState } from 'react';
import type { SurveyFieldsProps } from './FinancialFields';
import type { Mode } from '../../domain/product/profile';
import { Field, ToggleSet } from '../product/Common';
import p from '../product/product.module.css';
import { modeIcons } from '../product/ModeIcons';
const publicLabels: Record<Mode, string> = {
  car: 'Car',
  bicycle: 'Bicycle / Scooter',
  walk: 'Pedestrian',
  subway: 'Subway',
  train: 'Trains',
  bus: 'Buses',
  ferry: 'Ferries',
  'light-rail': 'Light Rail',
};
const publicModes: Mode[] = ['subway', 'train', 'bus', 'ferry', 'light-rail'];
export function MobilityFields({
  draft,
  patch,
  question,
}: SurveyFieldsProps & { question: string }) {
  const [lastLimit, setLastLimit] = useState(draft.walkingMiles || 1.5);
  if (question === 'assets')
    return (
      <>
        <ToggleSet
          label="Available transport assets"
          options={['car', 'bicycle', 'walk']}
          labels={{
            car: 'Car',
            bicycle: 'Bicycle / Scooter',
            walk: 'Pedestrian',
          }}
          icons={modeIcons}
          values={draft.modes.filter((m) => !publicModes.includes(m))}
          onChange={(v) =>
            patch({
              modes: [
                ...draft.modes.filter((m) => publicModes.includes(m)),
                ...(v as Mode[]),
              ],
            })
          }
        />
        {draft.modes.includes('bicycle') && (
          <Field label="Cycle availability">
            <select
              value={draft.cycleKind ?? 'bicycle'}
              onChange={(e) =>
                patch({
                  cycleKind: e.target.value as 'bicycle' | 'scooter' | 'both',
                })
              }
            >
              <option value="bicycle">Bicycle</option>
              <option value="scooter">Scooter</option>
              <option value="both">Both</option>
            </select>
          </Field>
        )}
        <label>
          <input
            type="checkbox"
            checked={draft.transitPass ?? false}
            onChange={(e) => patch({ transitPass: e.target.checked })}
          />{' '}
          <span aria-hidden="true">{modeIcons.train}</span> Transit Pass
        </label>
      </>
    );
  if (question === 'transit')
    return (
      <>
        <fieldset>
          <legend>Public transit filters</legend>
          <div className={p.chips}>
            {publicModes.map((mode) => (
              <label key={mode}>
                <input
                  type="checkbox"
                  checked={draft.modes.includes(mode)}
                  onChange={(e) =>
                    patch({
                      modes: e.target.checked
                        ? [...draft.modes, mode]
                        : draft.modes.filter((m) => m !== mode),
                    })
                  }
                />
                <span aria-hidden="true">{modeIcons[mode]}</span>
                {publicLabels[mode]}
              </label>
            ))}
          </div>
        </fieldset>
        <button
          type="button"
          onClick={() =>
            patch({
              modes: draft.modes.filter((m) => !publicModes.includes(m)),
            })
          }
        >
          No public transit
        </button>
      </>
    );
  const factor = draft.distanceUnit === 'km' ? 1.609344 : 1;
  return (
    <>
      <Field label="Walking distance unit">
        <select
          value={draft.distanceUnit}
          onChange={(e) =>
            patch({ distanceUnit: e.target.value as 'mi' | 'km' })
          }
        >
          <option value="mi">Miles</option>
          <option value="km">Kilometers</option>
        </select>
      </Field>
      <Field label="Maximum walking distance">
        <input
          type="range"
          min="0"
          max={5 * factor}
          step={0.1 * factor}
          disabled={draft.walkingMiles === 0}
          value={draft.walkingMiles * factor}
          onChange={(e) => {
            const walkingMiles = Math.min(5, Number(e.target.value) / factor);
            setLastLimit(walkingMiles);
            patch({ walkingMiles });
          }}
        />
        <output>
          {(draft.walkingMiles * factor).toFixed(1)} {draft.distanceUnit}{' '}
          maximum
        </output>
      </Field>
      <label>
        <input
          type="checkbox"
          checked={draft.walkingMiles === 0}
          onChange={(e) =>
            patch({
              walkingMiles: e.target.checked ? 0 : Math.max(0.1, lastLimit),
            })
          }
        />{' '}
        Opt-Out of Walking
      </label>
      {draft.walkingMiles > 0 && (
        <p>
          About {Math.round(draft.walkingMiles * 20)} minutes at a 3 mph walking
          pace.
        </p>
      )}
      <p>
        A route exceeding this distance is excluded, even if it includes a
        train, bus, or ferry.
      </p>
    </>
  );
}
