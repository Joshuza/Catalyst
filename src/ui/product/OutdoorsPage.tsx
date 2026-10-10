import { useState } from 'react';
import { activityTypes, type DataOf } from '../../domain/product/model';
import { weatherWindow } from '../../domain/product/weather';
import { rankTrail, type Forecast } from '../../domain/product/routes';
import { addDays, timeLabel } from '../../domain/product/dates';
import { freeWindow, protectedTime } from '../../domain/product/schedule';
import { workspace } from '../local/runtime';
import { Page, Panel, Field, DeleteRecord } from './Common';
import { ForecastFields } from './TransitForms';
import { ChoiceDeck } from './Animations';
import { useProduct, entities, run, type Entity } from './state';
import s from './product.module.css';
import { OutingGear } from './OutingGear';
import { TrailForm, ActivityLog } from './OutdoorForms';
export function OutdoorsPage() {
  const { profile, today } = useProduct();
  const [date, setDate] = useState(addDays(today, 1)),
    [start, setStart] = useState(8),
    [end, setEnd] = useState(16),
    [forecast, setForecast] = useState<Forecast>({
      rain: false,
      temperatureC: 20,
      sunsetHour: 18.5,
    }),
    [dog, setDog] = useState(false),
    [activity, setActivity] = useState('Hike'),
    [confirmCore, setConfirmCore] = useState(false),
    [message, setMessage] = useState('');
  const events = entities('event').filter((e) => e.data.date === date);
  const next = events
    .filter((e) => e.data.start >= end)
    .sort((a, b) => a.data.start - b.data.start)[0];
  const free = freeWindow(
    date,
    start,
    end,
    events.map((e) => e.data),
  );
  const ranked = entities('trail')
    .filter((t) => t.data.activity === activity)
    .map((trail) => ({
      trail,
      match: free
        ? rankTrail(
            profile,
            trail.data,
            (end - start) * 60,
            start,
            forecast,
            next?.data.start ?? 24,
            dog,
          )
        : null,
    }))
    .filter(
      (v) =>
        v.match &&
        freeWindow(
          date,
          v.match.route.departure,
          v.match.backBy,
          events.map((e) => e.data),
        ),
    )
    .sort((a, b) => b.match!.score - a.match!.score);
  const choose = async (
    trail: Entity<'trail'>,
    backBy: number,
    travelMinutes: number,
    departure: number,
    mode: DataOf<'place'>['routes'][number]['mode'],
  ) => {
    const event = workspace.make(trail.title, {
      type: 'event',
      date,
      start: departure,
      minutes: Math.ceil((backBy - departure) * 60),
      category: 'outing',
      taskId: null,
      travelMinutes: 0,
      location: trail.data.address,
      ticket: 'none',
      reference: '',
    });
    if (protectedTime(profile, event.data as DataOf<'event'>) && !confirmCore) {
      setMessage('Confirm an outing inside protected hours before scheduling.');
      return;
    }
    const outing = workspace.make(trail.title, {
      type: 'outing',
      trailId: trail.id,
      date,
      eventId: event.id,
      route: { mode, minutes: travelMinutes, departure, backBy },
      forecast,
      gear: [
        { name: 'Water bottle', owned: false, costCents: 0 },
        { name: 'Sunscreen', owned: false, costCents: 0 },
        { name: 'Weather-appropriate layers', owned: false, costCents: 0 },
      ],
    });
    await workspace.commit('Outing planned', [event, outing]);
    setMessage(
      `Planned ${trail.title}. ${travelMinutes} minutes to the trailhead; return by ${timeLabel(backBy)}.`,
    );
  };
  return (
    <Page
      title="Outdoors & activities"
      subtitle="An outing that fits your free time, travel options, ability, weather, and daylight."
    >
      <ChoiceDeck
        options={[...activityTypes]}
        selected={activity}
        onSelect={setActivity}
      />
      <div className={s.grid}>
        <Panel title="Your available window">
          <div className={s.form}>
            <Field label="Outing date">
              <input
                type="date"
                min={today}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>
            <div className={s.pair}>
              <Field label="Window start hour">
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={start}
                  onChange={(e) => setStart(Number(e.target.value))}
                />
              </Field>
              <Field label="Back by hour">
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={end}
                  onChange={(e) => setEnd(Number(e.target.value))}
                />
              </Field>
            </div>
            <ForecastFields value={forecast} onChange={setForecast} />
            {profile.petEnabled && (
              <label>
                <input
                  type="checkbox"
                  checked={dog}
                  onChange={(e) => setDog(e.target.checked)}
                />
                Dog-friendly only
              </label>
            )}
            <label>
              <input
                type="checkbox"
                checked={confirmCore}
                onChange={(e) => setConfirmCore(e.target.checked)}
              />
              Allow an outing inside protected working hours
            </label>
            <p className={s.muted}>
              Sunset {timeLabel(forecast.sunsetHour)}. All ranked outings
              include return travel and a daylight margin.
            </p>
            {!free && (
              <p className={s.alert}>This window overlaps an existing event.</p>
            )}
          </div>
          <TrailForm />
        </Panel>
        <Panel title="Ranked outings">
          {ranked.map(({ trail, match }) => (
            <div className={s.panel} key={trail.id}>
              <h3>
                {trail.title}{' '}
                <span className={s.badge}>
                  {match!.score}% match{trail.sampleSet ? ' · Sample' : ''}
                </span>
              </h3>
              <div className={s.row}>
                <span>{trail.data.distanceMiles} mi</span>
                <span>{trail.data.elevationFeet} ft gain</span>
                <span>{trail.data.minutes} min moving</span>
              </div>
              <p>
                {trail.data.difficulty} ·{' '}
                {trail.data.loop ? 'Loop' : 'Out-and-back'} ·{' '}
                {match!.route.minutes} min {match!.route.mode}
              </p>
              <svg
                className={s.chart}
                viewBox="0 0 400 100"
                role="img"
                aria-label={`${trail.title} elevation profile`}
              >
                <path
                  className={s.baseline}
                  d={trail.data.elevation
                    .map(
                      (v, i) =>
                        `${i ? 'L' : 'M'}${(i / (trail.data.elevation.length - 1 || 1)) * 400},${90 - (v / Math.max(...trail.data.elevation, 1)) * 75}`,
                    )
                    .join(' ')}
                />
              </svg>
              <p className={s.muted}>
                {match!.reasons.join(' · ')} · Back by{' '}
                {timeLabel(match!.backBy)}
              </p>
              <div className={s.chips}>
                {weatherWindow(forecast, start, end).map((h) => (
                  <span key={h.hour} className={s.badge} data-best={h.best}>
                    {timeLabel(h.hour)} · {h.temperatureC}°C ·{' '}
                    {h.rain ? 'Rain' : 'Dry'}
                    {h.best ? ' · Best weather' : ''}
                    {h.temperatureC >= 29 ? ' · Heat' : ''}
                  </span>
                ))}
              </div>
              <button
                type="button"
                className={s.primary}
                onClick={() =>
                  run(
                    choose(
                      trail,
                      match!.backBy,
                      match!.route.minutes,
                      match!.route.departure,
                      match!.route.mode,
                    ),
                  )
                }
              >
                Plan this outing
              </button>
              <DeleteRecord record={trail} />
            </div>
          ))}
          {!ranked.length && (
            <p className={s.empty}>
              No outings meet every limit. Add a trail and enable its activity
              in your profile, or adjust the available window.
            </p>
          )}
          {message && (
            <p role="status" className={s.alert}>
              {message}
            </p>
          )}
        </Panel>
        <OutingGear />
        <Panel title="Activity log">
          <ActivityLog />
        </Panel>
      </div>
    </Page>
  );
}
