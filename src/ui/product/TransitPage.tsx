import { useState } from 'react';
import { routeOptions, type Forecast } from '../../domain/product/routes';
import { freeWindow, protectedTime } from '../../domain/product/schedule';
import { timeLabel } from '../../domain/product/dates';
import { workspace } from '../local/runtime';
import { Page, Panel, Field, DeleteRecord } from './Common';
import { useProduct, entities, run, type Entity } from './state';
import { ForecastFields, VenueForm } from './TransitForms';
import s from './product.module.css';
export function TransitPage() {
  const { profile, today } = useProduct();
  const [selected, setSelected] = useState<Entity<'place'> | null>(null),
    [date, setDate] = useState(today),
    [departure, setDeparture] = useState(12),
    [forecast, setForecast] = useState<Forecast>({
      rain: false,
      temperatureC: 20,
      sunsetHour: 18,
    }),
    [confirm, setConfirm] = useState(false);
  const events = entities('event').filter((e) => e.data.date === date);
  const next = events
    .filter((e) => e.data.start >= departure)
    .sort((a, b) => a.data.start - b.data.start)[0];
  const venues = entities('place').filter(
    (v) =>
      profile.dietary.every((tag) => v.data.dietary.includes(tag)) &&
      routeOptions(
        profile,
        v.data.routes,
        departure,
        forecast,
        next?.data.start ?? 24,
        60,
      ).some((r) =>
        freeWindow(
          date,
          r.departure,
          r.arrival + (60 + r.minutes) / 60,
          events.map((e) => e.data),
        ),
      ) &&
      freeWindow(
        date,
        departure,
        departure + 1,
        events.map((e) => e.data),
      ),
  );
  const routes =
    selected && venues.some((v) => v.id === selected.id)
      ? routeOptions(
          profile,
          selected.data.routes,
          departure,
          forecast,
          next?.data.start ?? 24,
          60,
        ).filter((r) =>
          freeWindow(
            date,
            r.departure,
            r.arrival + (60 + r.minutes) / 60,
            events.map((e) => e.data),
          ),
        )
      : [];
  return (
    <Page
      title="Discovery & transit"
      subtitle="Compare available modes. Your walking limit and next event are hard boundaries."
    >
      <div className={s.grid}>
        <Panel title="A place that fits">
          <div className={s.form}>
            <Field label="Travel date">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>
            <Field label="Departure time">
              <input
                type="time"
                value={timeLabel(departure)}
                onChange={(e) => {
                  const [h, m] = e.target.value.split(':').map(Number);
                  setDeparture((h ?? 0) + (m ?? 0) / 60);
                }}
              />
            </Field>
            <ForecastFields value={forecast} onChange={setForecast} />
          </div>
          <p className={s.muted}>
            Manual weather and route data. Walking limit: {profile.walkingMiles}{' '}
            mi.{' '}
            {next
              ? `Next event: ${timeLabel(next.data.start)} ${next.title}.`
              : 'No later event recorded.'}
          </p>
          {venues.map((v) => (
            <div className={s.row} key={v.id}>
              <button type="button" onClick={() => setSelected(v)}>
                {v.title}
              </button>
              <span className={s.muted}>{v.data.address}</span>
            </div>
          ))}
          {!venues.length && (
            <p className={s.empty}>
              No places fit the current free time, dietary profile, and reach.
              Add a manual venue or change the time.
            </p>
          )}
          <VenueForm />
        </Panel>
        <Panel
          title={
            selected ? `Route to ${selected.title}` : 'Choose a destination'
          }
        >
          {selected && (
            <>
              <p>{selected.data.address}</p>
              {routes.map((r, i) => (
                <div className={s.panel} key={`${r.mode}-${i}`}>
                  <h3>
                    {r.mode} · {r.minutes} min
                  </h3>
                  <p>
                    Leave {timeLabel(r.departure)} · arrive{' '}
                    {timeLabel(r.arrival)} · {r.walkingMiles} mi walking
                  </p>
                  {r.warning && <p className={s.alert}>{r.warning}</p>}
                  {protectedTime(profile, {
                    date,
                    start: r.departure,
                    minutes: r.minutes * 2 + 60,
                  }) && (
                    <label>
                      <input
                        type="checkbox"
                        checked={confirm}
                        onChange={(e) => setConfirm(e.target.checked)}
                      />
                      Allow this visit inside protected working hours
                    </label>
                  )}
                  <button
                    type="button"
                    disabled={
                      protectedTime(profile, {
                        date,
                        start: r.departure,
                        minutes: r.minutes * 2 + 60,
                      }) && !confirm
                    }
                    onClick={() =>
                      run(
                        workspace.save(
                          workspace.make(selected.title, {
                            type: 'event',
                            date,
                            start: r.arrival,
                            minutes: 60 + r.minutes,
                            category: 'personal',
                            taskId: null,
                            travelMinutes: r.minutes,
                            location: selected.data.address,
                            ticket: r.mode === 'train' ? 'train' : 'none',
                            reference: '',
                          }),
                        ),
                      )
                    }
                  >
                    Add visit & route to calendar
                  </button>
                </div>
              ))}
              {!routes.length && (
                <p>No route fits the walking limit and next event.</p>
              )}
              <DeleteRecord record={selected} />
            </>
          )}
        </Panel>
      </div>
    </Page>
  );
}
