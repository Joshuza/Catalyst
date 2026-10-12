import { useState } from 'react';
import { addDays } from '../../domain/product/dates';
import { emptyTaskDetails } from '../../domain/product/model';
import { semanticTags } from '../../domain/product/evolution';
import { protectedTime } from '../../domain/product/schedule';
import { workspace } from '../local/runtime';
import { Page, Field, MoneyField } from './Common';
import { useProduct, navigate } from './state';
import { ReceiptPrinter } from './Animations';
import { SubscriptionForm } from './SubscriptionForm';
import s from './product.module.css';

const choices = [
  'Purchase',
  'Task',
  'Event',
  'Note',
  'Research',
  'Subscription',
] as const;
type Kind = (typeof choices)[number];
const destinations: Record<Kind, string> = {
  Purchase: 'finance',
  Task: 'tasks',
  Event: 'calendar',
  Note: 'records',
  Research: 'research',
  Subscription: 'finance',
};
export function CreatePage() {
  const { profile, today, busy, records } = useProduct();
  const [kind, setKind] = useState<Kind>('Purchase');
  const [title, setTitle] = useState(''),
    [body, setBody] = useState(''),
    [url, setUrl] = useState('');
  const [date, setDate] = useState(addDays(today, 7)),
    [cost, setCost] = useState(0),
    [start, setStart] = useState('18:00'),
    [minutes, setMinutes] = useState(60);
  const [allowProtected, setAllowProtected] = useState(false),
    [error, setError] = useState('');
  const [saved, setSaved] = useState<{
    id: string;
    title: string;
    kind: Kind;
    cents: number;
  } | null>(null);
  const hour = Number(start.slice(0, 2)) + Number(start.slice(3)) / 60;
  const protectedSlot =
    kind === 'Event' && protectedTime(profile, { date, start: hour, minutes });
  const retained =
    saved && records.some((r) => r.id === saved.id && !r.deletedAt);
  async function save() {
    try {
      if (!title.trim()) throw new Error('Enter a title.');
      if (kind === 'Purchase' && cost <= 0)
        throw new Error('Enter a positive purchase cost.');
      if (
        kind === 'Event' &&
        (!Number.isFinite(hour) || hour + minutes / 60 > 24)
      )
        throw new Error('Choose an event that ends within this day.');
      if (protectedSlot && !allowProtected)
        throw new Error('Confirm placement inside protected working hours.');
      const name = title.trim();
      const record =
        kind === 'Purchase'
          ? workspace.make(name, {
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
          : kind === 'Event'
            ? workspace.make(name, {
                type: 'event',
                date,
                start: hour,
                minutes,
                category: 'personal',
                taskId: null,
                travelMinutes: 0,
                location: '',
                ticket: 'none',
                reference: '',
              })
            : kind === 'Research'
              ? workspace.make(name, {
                  type: 'research',
                  body,
                  url,
                  image: '',
                  tags: semanticTags(name, body),
                  priority: 'Researching',
                  pros: '',
                  cons: '',
                  costCents: cost,
                  purchaseId: null,
                })
              : kind === 'Task'
                ? {
                    ...workspace.draft('task'),
                    title: name,
                    details: {
                      ...emptyTaskDetails(),
                      deadline: date,
                      role:
                        profile.persona === 'student'
                          ? ('student' as const)
                          : profile.persona === 'professional'
                            ? ('professional' as const)
                            : ('personal' as const),
                    },
                  }
                : { ...workspace.draft('note'), title: name, body };
      await workspace.save(record);
      setSaved({ id: record.id, title: name, kind, cents: cost });
      setTitle('');
      setBody('');
      setUrl('');
      setError('');
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Your entry could not be saved.',
      );
    }
  }
  return (
    <Page
      title="Add new"
      subtitle="One thought at a time. Choose what you want to capture; Catalyst puts it in the right place."
    >
      <div className={s.captureLayout}>
        <fieldset className={s.captureKinds}>
          <legend>What would you like to add?</legend>
          {choices.map((choice) => (
            <label key={choice}>
              <input
                type="radio"
                name="capture-kind"
                value={choice}
                checked={kind === choice}
                onChange={() => {
                  setKind(choice);
                  setError('');
                  setAllowProtected(false);
                }}
              />
              {choice}
            </label>
          ))}
        </fieldset>
        <section
          className={s.captureForm}
          aria-label={`New ${kind.toLowerCase()}`}
        >
          <h2>
            {kind === 'Purchase'
              ? 'Make room for something good.'
              : `A new ${kind.toLowerCase()}.`}
          </h2>
          {kind === 'Subscription' ? (
            <SubscriptionForm expanded />
          ) : (
            <form
              className={s.form}
              onSubmit={(e) => {
                e.preventDefault();
                void save();
              }}
            >
              <Field label="Entry title">
                <input
                  required
                  maxLength={300}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </Field>
              {(kind === 'Purchase' || kind === 'Research') && (
                <MoneyField
                  label="Estimated cost"
                  cents={cost}
                  currency={profile.currency}
                  onChange={setCost}
                />
              )}
              {['Purchase', 'Task', 'Event'].includes(kind) && (
                <Field label={kind === 'Task' ? 'Deadline' : 'Planned date'}>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value);
                      setAllowProtected(false);
                    }}
                  />
                </Field>
              )}
              {kind === 'Event' && (
                <>
                  <Field label="Start time">
                    <input
                      type="time"
                      required
                      value={start}
                      onChange={(e) => {
                        setStart(e.target.value);
                        setAllowProtected(false);
                      }}
                    />
                  </Field>
                  <Field label="Duration in minutes">
                    <input
                      type="number"
                      min="5"
                      max="1440"
                      required
                      value={minutes}
                      onChange={(e) => {
                        setMinutes(Number(e.target.value));
                        setAllowProtected(false);
                      }}
                    />
                  </Field>
                  {protectedSlot && (
                    <label>
                      <input
                        type="checkbox"
                        checked={allowProtected}
                        onChange={(e) => setAllowProtected(e.target.checked)}
                      />
                      Allow this event inside protected working hours
                    </label>
                  )}
                </>
              )}
              {(kind === 'Note' || kind === 'Research') && (
                <Field label="Notes">
                  <textarea
                    maxLength={10000}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                  />
                </Field>
              )}
              {kind === 'Research' && (
                <Field label="Source link">
                  <input
                    type="url"
                    maxLength={500}
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </Field>
              )}
              {kind === 'Purchase' && (
                <p className={s.muted}>
                  A planned purchase changes your dotted projection. No payment
                  is made.
                </p>
              )}
              {error && <p role="alert">{error}</p>}
              <button
                className={s.primary}
                type="submit"
                disabled={busy || !title.trim()}
              >
                Save {kind.toLowerCase()}
              </button>
            </form>
          )}
          {retained && saved && (
            <div className={s.captureSaved} role="status">
              <p>Saved: {saved.title}</p>
              <button
                type="button"
                onClick={() => navigate(destinations[saved.kind])}
              >
                Open in{' '}
                {saved.kind === 'Purchase'
                  ? 'Financial Core'
                  : saved.kind === 'Note'
                    ? 'Notes & records'
                    : saved.kind}
              </button>
              {saved.kind === 'Purchase' && (
                <ReceiptPrinter
                  key={saved.id}
                  title={saved.title}
                  cents={saved.cents}
                  planned
                />
              )}
            </div>
          )}
        </section>
      </div>
      <details className={s.quietDetails}>
        <summary>Add something else</summary>
        <div className={s.actions}>
          {[
            ['food', 'Recipe or groceries'],
            ['receipts', 'Receipt'],
            ['goals', 'Savings goal'],
            ['contacts', 'Contact'],
            ['itineraries', 'Trip or ticket'],
            ['health', 'Care reminder'],
          ].map(([page, label]) => (
            <button type="button" key={page} onClick={() => navigate(page!)}>
              {label}
            </button>
          ))}
        </div>
      </details>
    </Page>
  );
}
