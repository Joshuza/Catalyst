import { useState } from 'react';
import { addDays, addMonths, timeLabel } from '../../domain/product/dates';
import { personalSlot } from '../../domain/product/schedule';
import type { DataOf } from '../../domain/product/model';
import { workspace } from '../local/runtime';
import { Page, Panel, Field, DeleteRecord } from './Common';
import { useProduct, entities, run, focusCalendar } from './state';
import s from './product.module.css';
export function HealthPage() {
  const { today, profile, busy } = useProduct();
  const [title, setTitle] = useState(''),
    [date, setDate] = useState(addDays(today, 30)),
    [notes, setNotes] = useState(''),
    [category, setCategory] = useState<DataOf<'health'>['category']>('Checkup'),
    [repeat, setRepeat] = useState(0),
    [error, setError] = useState('');
  async function save() {
    try {
      await workspace.save(
        workspace.make(title, {
          type: 'health',
          date,
          notes,
          category,
          completed: false,
          repeatMonths: repeat,
          eventId: null,
        }),
      );
      setTitle('');
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Reminder could not be saved.');
    }
  }
  async function schedule(id: string) {
    try {
      const health = entities('health').find((r) => r.id === id);
      if (!health) return;
      const slot = personalSlot(
        profile,
        health.data.date,
        entities('event').map((e) => e.data),
        18,
        30,
      );
      if (!slot)
        throw new Error(
          'No free time outside protected work hours. Schedule a time manually in Calendar.',
        );
      const event = workspace.make(health.title, {
        type: 'event',
        ...slot,
        category: 'personal',
        taskId: null,
        travelMinutes: 0,
        location: '',
        ticket: 'none',
        reference: '',
      });
      await workspace.commit('Care reminder scheduled', [
        event,
        { ...health, data: { ...health.data, eventId: event.id } },
      ]);
      setError(
        `Reminder placed at ${timeLabel(slot.start)}. Confirm the actual appointment with your provider.`,
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Reminder could not be scheduled.',
      );
    }
  }
  async function complete(id: string) {
    const h = entities('health').find((r) => r.id === id);
    if (!h) return;
    await workspace.commit('Care reminder completed', [
      { ...h, data: { ...h.data, completed: true } },
      ...(h.data.repeatMonths
        ? [
            workspace.make(h.title, {
              ...h.data,
              date: addMonths(
                h.data.date < today ? today : h.data.date,
                h.data.repeatMonths,
              ),
              completed: false,
              eventId: null,
            }),
          ]
        : []),
    ]);
  }
  return (
    <Page
      title="Health & care"
      subtitle="Keep checkups, dental care, and refill reminders in view. You choose every date and recurrence; Catalyst does not give medical advice."
    >
      <div className={s.grid}>
        <Panel title="Upcoming care" wide>
          {entities('health')
            .sort((a, b) => a.data.date.localeCompare(b.data.date))
            .map((h) => (
              <div key={h.id} className={s.row}>
                <div>
                  <h3>{h.title}</h3>
                  <p>
                    {h.data.category} · {h.data.date} ·{' '}
                    {h.data.completed
                      ? 'Completed'
                      : h.data.date < today
                        ? 'Overdue'
                        : 'Upcoming'}
                  </p>
                  <p>{h.data.notes}</p>
                </div>
                <div className={s.actions}>
                  {!h.data.completed && (
                    <button type="button" onClick={() => run(complete(h.id))}>
                      Mark completed
                    </button>
                  )}
                  {!h.data.eventId && !h.data.completed && (
                    <button type="button" onClick={() => void schedule(h.id)}>
                      Add calendar reminder
                    </button>
                  )}
                  {h.data.eventId && (
                    <button
                      type="button"
                      onClick={() => focusCalendar(h.data.date)}
                    >
                      View in Calendar
                    </button>
                  )}
                  <DeleteRecord record={h} />
                </div>
              </div>
            ))}
          {!entities('health').length && (
            <p className={s.empty}>
              Add a care date so routine appointments and refills are easier to
              remember.
            </p>
          )}
          {error && <p role="status">{error}</p>}
        </Panel>
        <Panel title="Add a care reminder">
          <form
            className={s.form}
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
          >
            <Field label="Care title">
              <input
                required
                maxLength={300}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Field>
            <Field label="Care category">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as typeof category)}
              >
                {['Checkup', 'Dental', 'Eye care', 'Prescription', 'Other'].map(
                  (v) => (
                    <option key={v}>{v}</option>
                  ),
                )}
              </select>
            </Field>
            <Field label="Care date">
              <input
                required
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>
            <Field label="Repeat after months">
              <input
                type="number"
                min="0"
                max="60"
                value={repeat}
                onChange={(e) => setRepeat(Number(e.target.value))}
              />
              <span className={s.muted}>
                0 means no repeat. Confirm intervals with your care provider.
              </span>
            </Field>
            <Field label="Care notes">
              <textarea
                maxLength={20000}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Field>
            <button className={s.primary} disabled={busy}>
              Save care reminder
            </button>
          </form>
        </Panel>
      </div>
    </Page>
  );
}
