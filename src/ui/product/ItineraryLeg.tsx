import { useState } from 'react';
import { overlap, protectedTime } from '../../domain/product/schedule';
import { timeLabel } from '../../domain/product/dates';
import type { DataOf } from '../../domain/product/model';
import { workspace } from '../local/runtime';
import { Field, MoneyField } from './Common';
import { useProduct, entities, type Entity } from './state';
import s from './product.module.css';
export function ItineraryLeg({
  trip,
  onSaved,
}: {
  trip: Entity<'itinerary'>;
  onSaved: () => void;
}) {
  const { today, profile, busy } = useProduct();
  const [title, setTitle] = useState(''),
    [date, setDate] = useState(trip.data.startDate),
    [hour, setHour] = useState(9),
    [minutes, setMinutes] = useState(60),
    [travel, setTravel] = useState(0),
    [location, setLocation] = useState(''),
    [reference, setReference] = useState(''),
    [url, setUrl] = useState(''),
    [ticket, setTicket] = useState<DataOf<'event'>['ticket']>('event'),
    [cost, setCost] = useState(0),
    [confirm, setConfirm] = useState(false),
    [error, setError] = useState('');
  async function save() {
    try {
      const slot = { date, start: hour, minutes };
      if (date < trip.data.startDate || date > trip.data.endDate)
        throw new Error('Choose a date within this itinerary.');
      if (protectedTime(profile, slot) && !confirm)
        throw new Error('Confirm placement inside protected working hours.');
      if (
        entities('event').some((e) =>
          overlap(
            { ...slot, start: hour - travel / 60, minutes: minutes + travel },
            {
              ...e.data,
              start: e.data.start - e.data.travelMinutes / 60,
              minutes: e.data.minutes + e.data.travelMinutes,
            },
          ),
        )
      )
        throw new Error(
          'This event or its travel time overlaps a calendar commitment. Choose another time.',
        );
      if (cost > 0 && date <= today)
        throw new Error(
          'Log an already paid ticket in Receipts or Notes & records. Future ticket costs can be planned here.',
        );
      const purchase =
        cost > 0
          ? workspace.make(title, {
              type: 'purchase',
              costCents: cost,
              date,
              status: 'planned',
              scenario: 'Main',
              actualCents: null,
              regret: null,
              emotion: null,
              transactionId: null,
            })
          : null;
      const event = workspace.make(title, {
        type: 'event',
        ...slot,
        category: 'travel',
        taskId: null,
        travelMinutes: travel,
        location,
        ticket,
        reference,
        ticketUrl: url,
        purchaseId: purchase?.id ?? null,
      });
      await workspace.commit('Itinerary stop added', [
        event,
        ...(purchase ? [purchase] : []),
        {
          ...trip,
          data: { ...trip.data, eventIds: [...trip.data.eventIds, event.id] },
        },
      ]);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Stop could not be saved.');
    }
  }
  return (
    <form
      className={s.form}
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <Field label="Stop or ticket title">
        <input
          required
          value={title}
          maxLength={300}
          onChange={(e) => setTitle(e.target.value)}
        />
      </Field>
      <div className={s.pair}>
        <Field label="Stop date">
          <input
            type="date"
            required
            min={trip.data.startDate}
            max={trip.data.endDate}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>
        <Field label="Stop start time">
          <input
            type="time"
            required
            value={timeLabel(hour)}
            onChange={(e) => {
              const [h, m] = e.target.value.split(':').map(Number);
              setHour((h ?? 0) + (m ?? 0) / 60);
            }}
          />
        </Field>
      </div>
      <Field label="Stop duration minutes">
        <input
          type="number"
          min="1"
          max="1440"
          value={minutes}
          onChange={(e) => setMinutes(Number(e.target.value))}
        />
      </Field>
      <Field label="Travel to stop minutes">
        <input
          type="number"
          min="0"
          max="1440"
          value={travel}
          onChange={(e) => setTravel(Number(e.target.value))}
        />
      </Field>
      <Field label="Stop location">
        <input
          value={location}
          maxLength={300}
          onChange={(e) => setLocation(e.target.value)}
        />
      </Field>
      <Field label="Ticket type">
        <select
          value={ticket}
          onChange={(e) => setTicket(e.target.value as typeof ticket)}
        >
          {['none', 'event', 'flight', 'train'].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </Field>
      <Field label="Confirmation reference">
        <input
          value={reference}
          maxLength={300}
          onChange={(e) => setReference(e.target.value)}
        />
      </Field>
      <Field label="Original ticket link">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </Field>
      <MoneyField label="Future ticket cost" cents={cost} onChange={setCost} />
      {protectedTime(profile, { date, start: hour, minutes }) && (
        <label>
          <input
            type="checkbox"
            checked={confirm}
            onChange={(e) => setConfirm(e.target.checked)}
          />
          Allow this stop inside protected work hours
        </label>
      )}
      <button className={s.primary} disabled={busy}>
        Add stop to itinerary
      </button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
