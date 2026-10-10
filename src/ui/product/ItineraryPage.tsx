import { useState } from 'react';
import { addDays, timeLabel } from '../../domain/product/dates';
import { workspace } from '../local/runtime';
import { Modal } from '../local/Modal';
import { Page, Panel, Field, DeleteRecord } from './Common';
import { useProduct, entities, run, focusCalendar, type Entity } from './state';
import { Ticket } from './Animations';
import { ItineraryLeg } from './ItineraryLeg';
import s from './product.module.css';
export function ItineraryPage() {
  const { today, busy } = useProduct();
  const [title, setTitle] = useState(''),
    [start, setStart] = useState(addDays(today, 7)),
    [end, setEnd] = useState(addDays(today, 8)),
    [notes, setNotes] = useState(''),
    [adding, setAdding] = useState<Entity<'itinerary'> | null>(null),
    [error, setError] = useState('');
  return (
    <Page
      title="Itineraries & tickets"
      subtitle="Plan trips, conferences, and events with calendar stops, travel buffers, original ticket links, and optional future costs."
    >
      <div className={s.grid}>
        <Panel title="Your plans" wide>
          {entities('itinerary').map((trip) => {
            const stops = entities('event')
              .filter((e) => trip.data.eventIds.includes(e.id))
              .sort(
                (a, b) =>
                  a.data.date.localeCompare(b.data.date) ||
                  a.data.start - b.data.start,
              );
            return (
              <article className={s.panel} key={trip.id}>
                <div className={s.row}>
                  <div>
                    <h3>{trip.title}</h3>
                    <p>
                      {trip.data.startDate} to {trip.data.endDate}
                    </p>
                  </div>
                  <div className={s.actions}>
                    <button type="button" onClick={() => setAdding(trip)}>
                      Add stop or ticket
                    </button>
                    <DeleteRecord record={trip} />
                  </div>
                </div>
                <p>{trip.data.notes}</p>
                <div className={s.grid}>
                  {stops.map((e) => (
                    <section key={e.id} className={s.panel}>
                      <p className={s.eyebrow}>
                        {e.data.date} · {timeLabel(e.data.start)}
                      </p>
                      {e.data.ticket !== 'none' ? (
                        <Ticket event={e} />
                      ) : (
                        <h3>{e.title}</h3>
                      )}
                      <p>
                        {e.data.minutes} minutes · leave by{' '}
                        {timeLabel(e.data.start - e.data.travelMinutes / 60)}
                      </p>
                      <div className={s.actions}>
                        <button
                          type="button"
                          onClick={() => focusCalendar(e.data.date)}
                        >
                          Open calendar
                        </button>
                        <DeleteRecord record={e} />
                      </div>
                    </section>
                  ))}
                </div>
                {!stops.length && (
                  <p className={s.empty}>
                    Add a first stop to create this itinerary’s calendar
                    timeline.
                  </p>
                )}
              </article>
            );
          })}
          {!entities('itinerary').length && (
            <p className={s.empty}>
              Create a trip or event plan, then add its stops and tickets.
            </p>
          )}
        </Panel>
        <Panel title="Create an itinerary">
          <form
            className={s.form}
            onSubmit={(e) => {
              e.preventDefault();
              run(
                workspace
                  .save(
                    workspace.make(title, {
                      type: 'itinerary',
                      startDate: start,
                      endDate: end,
                      eventIds: [],
                      notes,
                    }),
                  )
                  .then(() => {
                    setTitle('');
                    setError('');
                  })
                  .catch((e) =>
                    setError(
                      e instanceof Error
                        ? e.message
                        : 'Itinerary could not be saved.',
                    ),
                  ),
              );
            }}
          >
            <Field label="Itinerary name">
              <input
                required
                maxLength={300}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Field>
            <Field label="Trip begins">
              <input
                required
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </Field>
            <Field label="Trip ends">
              <input
                required
                type="date"
                min={start}
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </Field>
            <Field label="Itinerary notes">
              <textarea
                maxLength={20000}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Field>
            <button className={s.primary} disabled={busy}>
              Create itinerary
            </button>
            {error && <p role="alert">{error}</p>}
          </form>
        </Panel>
      </div>
      {adding && (
        <Modal
          title={`Add stop to ${adding.title}`}
          onClose={() => setAdding(null)}
        >
          <div className={s.page}>
            <ItineraryLeg trip={adding} onSaved={() => setAdding(null)} />
          </div>
        </Modal>
      )}
    </Page>
  );
}
