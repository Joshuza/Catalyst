import { useState } from 'react';
import { activityTypes, type DataOf } from '../../domain/product/model';
import { addDays } from '../../domain/product/dates';
import { Field } from './Common';
import { RouteFields } from './TransitForms';
import { useProduct, entities, run } from './state';
import { workspace } from '../local/runtime';
import s from './product.module.css';
export function TrailForm() {
  const [title, setTitle] = useState(''),
    [routes, setRoutes] = useState<DataOf<'trail'>['routes']>([]),
    [distance, setDistance] = useState(5),
    [elevation, setElevation] = useState(900),
    [minutes, setMinutes] = useState(160),
    [dog, setDog] = useState(false),
    [loop, setLoop] = useState(true),
    [difficulty, setDifficulty] =
      useState<DataOf<'trail'>['difficulty']>('Moderate'),
    [activity, setActivity] = useState<DataOf<'trail'>['activity']>('Hike'),
    [profile, setProfile] = useState(''),
    [address, setAddress] = useState('');
  return (
    <details>
      <summary>Add manual trail or activity</summary>
      <div className={s.form}>
        <Field label="Trail name">
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Trailhead address">
          <input value={address} onChange={(e) => setAddress(e.target.value)} />
        </Field>
        <Field label="Activity type">
          <select
            value={activity}
            onChange={(e) => setActivity(e.target.value as typeof activity)}
          >
            {activityTypes.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </Field>
        <div className={s.pair}>
          <Field label="Trail distance miles">
            <input
              type="number"
              min=".1"
              step=".1"
              value={distance}
              onChange={(e) => setDistance(Number(e.target.value))}
            />
          </Field>
          <Field label="Elevation gain feet">
            <input
              type="number"
              min="0"
              value={elevation}
              onChange={(e) => setElevation(Number(e.target.value))}
            />
          </Field>
          <Field label="Moving minutes">
            <input
              type="number"
              min="1"
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
            />
          </Field>
          <Field label="Difficulty">
            <select
              value={difficulty}
              onChange={(e) =>
                setDifficulty(e.target.value as typeof difficulty)
              }
            >
              {['Easy', 'Moderate', 'Hard'].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Elevation profile points">
          <input value={profile} onChange={(e) => setProfile(e.target.value)} />
          <span className={s.muted}>
            Optional: enter measured elevations in feet, separated by commas.
          </span>
        </Field>
        <label>
          <input
            type="checkbox"
            checked={dog}
            onChange={(e) => setDog(e.target.checked)}
          />
          Dog-friendly
        </label>
        <label>
          <input
            type="checkbox"
            checked={loop}
            onChange={(e) => setLoop(e.target.checked)}
          />
          Loop route
        </label>
        <RouteFields routes={routes} onChange={setRoutes} />
        <button
          type="button"
          disabled={!title.trim() || !routes.length}
          onClick={() =>
            run(
              workspace
                .save(
                  workspace.make(title, {
                    type: 'trail',
                    address,
                    dietary: [],
                    routes,
                    distanceMiles: distance,
                    elevationFeet: elevation,
                    minutes,
                    difficulty,
                    loop,
                    dogFriendly: dog,
                    activity,
                    elevation: profile.trim()
                      ? profile.split(',').map(Number)
                      : [],
                  }),
                )
                .then(() => setTitle('')),
            )
          }
        >
          Save trail
        </button>
      </div>
    </details>
  );
}
export function ActivityLog() {
  const { today } = useProduct();
  const [date, setDate] = useState(today),
    [activity, setActivity] = useState<DataOf<'activity'>['activity']>('Hike'),
    [miles, setMiles] = useState(0),
    [elevation, setElevation] = useState(0);
  const logs = entities('activity');
  return (
    <>
      <div className={s.form}>
        <Field label="Activity log date">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>
        <Field label="Log activity type">
          <select
            value={activity}
            onChange={(e) => setActivity(e.target.value as typeof activity)}
          >
            {activityTypes.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </Field>
        <div className={s.pair}>
          <Field label="Miles completed">
            <input
              type="number"
              min="0"
              step=".1"
              value={miles}
              onChange={(e) => setMiles(Number(e.target.value))}
            />
          </Field>
          <Field label="Elevation completed feet">
            <input
              type="number"
              min="0"
              value={elevation}
              onChange={(e) => setElevation(Number(e.target.value))}
            />
          </Field>
        </div>
        <button
          type="button"
          onClick={() =>
            run(
              workspace.save(
                workspace.make(`${activity} on ${date}`, {
                  type: 'activity',
                  date,
                  activity,
                  miles,
                  elevationFeet: elevation,
                }),
              ),
            )
          }
        >
          Log outing
        </button>
      </div>
      <h3>Past seven days</h3>
      {Array.from({ length: 7 }, (_, i) => addDays(today, i - 6)).map((d) => {
        const distance = logs
          .filter((l) => l.data.date === d)
          .reduce((sum, l) => sum + l.data.miles, 0);
        return (
          <div className={s.row} key={d}>
            <span>{d}</span>
            <meter
              min="0"
              max={Math.max(10, ...logs.map((l) => l.data.miles))}
              value={distance}
            />
            <span>{distance.toFixed(1)} mi</span>
          </div>
        );
      })}
    </>
  );
}
