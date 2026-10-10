import { timeLabel } from '../../domain/product/dates';
import type { Profile } from '../../domain/product/model';
import { modeIcons } from './ModeIcons';
import { Field, ToggleSet } from './Common';
import s from './product.module.css';
import { modeSchema } from '../../domain/product/model';
const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export function ProfileWeek({
  draft,
  patch,
  show,
}: {
  draft: Profile;
  patch: (p: Partial<Profile>) => void;
  show: (i: number) => boolean;
}) {
  return (
    <>
      {show(6) && (
        <>
          <h3>Protected working hours</h3>
          {days.map((day, index) => (
            <div className={s.row} key={day}>
              <button
                type="button"
                aria-pressed={draft.shifts.some((v) => v.day === index)}
                onClick={() =>
                  patch({
                    shifts: draft.shifts.some((v) => v.day === index)
                      ? draft.shifts.filter((v) => v.day !== index)
                      : [...draft.shifts, { day: index, start: 9, end: 17 }],
                  })
                }
              >
                {day}
              </button>
              {draft.shifts.map(
                (shift, i) =>
                  shift.day === index && (
                    <div className={s.pair} key={i}>
                      <Field label={`${day} shift start`}>
                        <input
                          type="range"
                          min="0"
                          max="23.5"
                          step=".5"
                          value={shift.start}
                          onChange={(e) =>
                            patch({
                              shifts: draft.shifts.map((v, j) =>
                                j === i
                                  ? { ...v, start: Number(e.target.value) }
                                  : v,
                              ),
                            })
                          }
                        />
                        <span>{timeLabel(shift.start)}</span>
                      </Field>
                      <Field label={`${day} shift end`}>
                        <input
                          type="range"
                          min=".5"
                          max="24"
                          step=".5"
                          value={shift.end}
                          onChange={(e) =>
                            patch({
                              shifts: draft.shifts.map((v, j) =>
                                j === i
                                  ? { ...v, end: Number(e.target.value) }
                                  : v,
                              ),
                            })
                          }
                        />
                        <span>{timeLabel(shift.end)}</span>
                      </Field>
                    </div>
                  ),
              )}
            </div>
          ))}
          <Field label="Add split shift on day">
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value !== '')
                  patch({
                    shifts: [
                      ...draft.shifts,
                      { day: Number(e.target.value), start: 18, end: 20 },
                    ],
                  });
                e.target.value = '';
              }}
            >
              <option value="">Choose a day</option>
              {days.map((d, i) => (
                <option key={d} value={i}>
                  {d}
                </option>
              ))}
            </select>
          </Field>
        </>
      )}
      {show(7) && (
        <>
          <ToggleSet
            label="Transit assets and public modes"
            icons={modeIcons}
            labels={{
              car: 'Personal Car',
              bicycle: 'Bicycle',
              walk: 'Walking Only',
              train: 'Commuter Trains',
              subway: 'Subway',
              bus: 'City Buses',
              ferry: 'Ferries',
            }}
            options={modeSchema.options}
            values={draft.modes}
            onChange={(v) => patch({ modes: v as Profile['modes'] })}
          />
          <button
            type="button"
            aria-pressed={
              !draft.modes.some((m) =>
                ['train', 'subway', 'bus', 'ferry'].includes(m),
              )
            }
            onClick={() =>
              patch({
                modes: draft.modes.filter(
                  (m) => !['train', 'subway', 'bus', 'ferry'].includes(m),
                ),
              })
            }
          >
            No public transit
          </button>
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
          <Field label="Maximum comfortable walking distance">
            <input
              type="range"
              min="0.5"
              max="5"
              step="0.1"
              value={Math.max(0.5, draft.walkingMiles)}
              onChange={(e) => patch({ walkingMiles: Number(e.target.value) })}
            />
            <span>
              {(
                draft.walkingMiles *
                (draft.distanceUnit === 'km' ? 1.609344 : 1)
              ).toFixed(1)}{' '}
              {draft.distanceUnit} · about {Math.round(draft.walkingMiles * 20)}{' '}
              minutes
            </span>
          </Field>
          <label>
            <input
              type="checkbox"
              checked={draft.walkingMiles === 0}
              onChange={(e) =>
                patch({ walkingMiles: e.target.checked ? 0 : 1.5 })
              }
            />
            Prefer not to walk
          </label>
        </>
      )}
    </>
  );
}
