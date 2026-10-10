import { useState } from 'react';
import { protectedTime } from '../../domain/product/schedule';
import { timeLabel } from '../../domain/product/dates';
import type { DataOf } from '../../domain/product/model';
import { workspace } from '../local/runtime';
import { Modal } from '../local/Modal';
import { Field } from './Common';
import { useProduct, type Entity } from './state';
import s from './product.module.css';
export function CalendarEditor({
  slot,
  existing,
  onClose,
}: {
  slot: { date: string; start: number };
  existing?: Entity<'event'> | null;
  onClose: () => void;
}) {
  const { profile } = useProduct();
  const [draft, setDraft] = useState(slot),
    [title, setTitle] = useState(existing?.title ?? ''),
    [hour, setHour] = useState(slot.start),
    [minutes, setMinutes] = useState(existing?.data.minutes ?? 60),
    [category, setCategory] = useState<DataOf<'event'>['category']>(
      existing?.data.category ?? 'personal',
    ),
    [confirmed, setConfirmed] = useState(false),
    [location, setLocation] = useState(existing?.data.location ?? ''),
    [ticket, setTicket] = useState<DataOf<'event'>['ticket']>(
      existing?.data.ticket ?? 'none',
    ),
    [ticketUrl, setTicketUrl] = useState(existing?.data.ticketUrl ?? ''),
    [reference, setReference] = useState(existing?.data.reference ?? ''),
    [error, setError] = useState('');
  const protectedSlot =
    ['personal', 'outing'].includes(category) &&
    protectedTime(profile, { date: draft.date, start: hour, minutes });
  async function save() {
    try {
      if (!title.trim()) throw new Error('Enter an event title.');
      if (hour + minutes / 60 > 24)
        throw new Error(
          'The event must finish within this day. Split an overnight event into two blocks.',
        );
      if (protectedSlot && !confirmed)
        throw new Error('Confirm placement inside protected hours.');
      const data: DataOf<'event'> = {
        type: 'event',
        date: draft.date,
        start: hour,
        minutes,
        category,
        taskId: existing?.data.taskId ?? null,
        travelMinutes: existing?.data.travelMinutes ?? 0,
        location,
        ticket,
        reference,
        ticketUrl,
        purchaseId: existing?.data.purchaseId ?? null,
      };
      await workspace.save(
        existing ? { ...existing, title, data } : workspace.make(title, data),
      );
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'The event could not be saved.',
      );
    }
  }
  return (
    <Modal
      title={existing ? 'Edit calendar event' : 'New calendar event'}
      onClose={onClose}
    >
      <div className={s.page}>
        <form
          className={s.form}
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <Field label="Event title">
            <input
              autoFocus
              value={title}
              maxLength={300}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
          <Field label="Event date">
            <input
              type="date"
              value={draft.date}
              onChange={(e) =>
                setDraft((v) => (v ? { ...v, date: e.target.value } : v))
              }
            />
          </Field>
          <div className={s.pair}>
            <Field label="Start time">
              <input
                type="time"
                value={timeLabel(hour)}
                onChange={(e) => {
                  const [h, m] = e.target.value.split(':').map(Number);
                  setHour((h ?? 0) + (m ?? 0) / 60);
                }}
              />
            </Field>
            <Field label="Duration in minutes">
              <input
                type="number"
                min="15"
                max="1440"
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
              />
            </Field>
          </div>
          <Field label="Event category">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as typeof category)}
            >
              {['personal', 'work', 'focus', 'travel', 'outing'].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </Field>
          <Field label="Location">
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </Field>
          <Field label="Ticket reminder">
            <select
              value={ticket}
              onChange={(e) => setTicket(e.target.value as typeof ticket)}
            >
              {['none', 'event', 'flight', 'train'].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </Field>
          {ticket !== 'none' && (
            <Field label="Booking reference">
              <input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </Field>
          )}
          {ticket !== 'none' && (
            <Field label="Original ticket URL">
              <input
                type="url"
                value={ticketUrl}
                onChange={(e) => setTicketUrl(e.target.value)}
              />
              <span className={s.muted}>
                Use your provider's original ticket. Nexus does not issue entry
                codes.
              </span>
            </Field>
          )}
          {protectedSlot && (
            <label>
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
              />
              Allow this personal event inside protected core hours
            </label>
          )}
          {error && <p role="alert">{error}</p>}
          <button type="submit" className={s.primary}>
            Save event
          </button>
        </form>
      </div>
    </Modal>
  );
}
