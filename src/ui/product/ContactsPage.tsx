import { useState } from 'react';
import { addDays, daysBetween } from '../../domain/product/dates';
import { workspace } from '../local/runtime';
import { Page, Panel, Field, DeleteRecord } from './Common';
import { useProduct, entities, run, type Entity } from './state';
import s from './product.module.css';
export function ContactsPage() {
  const { today } = useProduct();
  const [name, setName] = useState(''),
    [email, setEmail] = useState(''),
    [birthday, setBirthday] = useState(''),
    [rhythm, setRhythm] = useState(30),
    [trusted, setTrusted] = useState(false);
  return (
    <Page
      title="People & relationships"
      subtitle="Keep a gentle contact rhythm, gift ideas, and the context that makes a check-in personal."
    >
      <div className={s.grid}>
        <Panel title="Your people" wide>
          {entities('contact').map((c) => (
            <ContactCard key={c.id} contact={c} today={today} />
          ))}
          {!entities('contact').length && (
            <p className={s.empty}>
              Add a person to track check-ins and gift ideas.
            </p>
          )}
        </Panel>
        <Panel title="Add a contact">
          <form
            className={s.form}
            onSubmit={(e) => {
              e.preventDefault();
              run(
                workspace
                  .save(
                    workspace.make(name, {
                      type: 'contact',
                      email,
                      birthday: birthday || null,
                      rhythmDays: rhythm,
                      lastContact: today,
                      trusted,
                      gifts: '',
                      logs: [],
                    }),
                  )
                  .then(() => setName('')),
              );
            }}
          >
            <Field label="Contact name">
              <input
                value={name}
                maxLength={300}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <Field label="Contact email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field label="Birthday">
              <input
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
              />
            </Field>
            <Field label="Preferred contact rhythm days">
              <input
                type="number"
                min="1"
                max="730"
                value={rhythm}
                onChange={(e) => setRhythm(Number(e.target.value))}
              />
            </Field>
            <label>
              <input
                type="checkbox"
                checked={trusted}
                onChange={(e) => setTrusted(e.target.checked)}
              />
              Trusted contact for copyable outing plans
            </label>
            <button type="submit" disabled={!name.trim()} className={s.primary}>
              Save contact
            </button>
          </form>
        </Panel>
        <Panel title="Quiet reminders">
          <p>
            Nudges appear in the briefing and weekly reset. Nexus never sends
            messages to your contacts.
          </p>
          <p className={s.muted}>
            Contact details, gift ideas, and logs are encrypted on this device.
          </p>
        </Panel>
      </div>
    </Page>
  );
}
function ContactCard({
  contact: c,
  today,
}: {
  contact: Entity<'contact'>;
  today: string;
}) {
  const overdue = daysBetween(c.data.lastContact, today) >= c.data.rhythmDays;
  let bday = c.data.birthday
    ? `${today.slice(0, 4)}${c.data.birthday.slice(4)}`
    : null;
  if (bday && bday < today)
    bday = `${Number(today.slice(0, 4)) + 1}${bday.slice(4)}`;
  const birthdaySoon =
    bday && daysBetween(today, bday) >= 0 && daysBetween(today, bday) <= 30;
  const log = (note: string) =>
    workspace.save({
      ...c,
      data: {
        ...c.data,
        lastContact: today,
        logs: [...c.data.logs, { date: today, note }],
      },
    });
  return (
    <div className={s.panel}>
      <div className={s.row}>
        <h3>{c.title}</h3>
        <span className={s.badge}>
          {overdue
            ? 'Check-in due'
            : `Next check-in ${addDays(c.data.lastContact, c.data.rhythmDays)}`}
        </span>
      </div>
      <p className={s.muted}>
        Last contact {c.data.lastContact} · every {c.data.rhythmDays} days
      </p>
      {birthdaySoon && (
        <p className={s.alert}>
          Birthday coming up. Gift ideas:{' '}
          {c.data.gifts || 'No ideas saved yet.'}
        </p>
      )}
      <Field label={`Contact rhythm for ${c.title}`}>
        <input
          type="number"
          min="1"
          max="730"
          defaultValue={c.data.rhythmDays}
          onBlur={(e) => {
            const rhythmDays = Number(e.target.value);
            if (rhythmDays !== c.data.rhythmDays)
              run(workspace.save({ ...c, data: { ...c.data, rhythmDays } }));
          }}
        />
      </Field>
      {today.slice(5) >= '12-01' && (
        <p className={s.muted}>
          Holiday gift ideas: {c.data.gifts || 'No ideas saved yet.'}
        </p>
      )}
      <Field label={`Gift ideas for ${c.title}`}>
        <textarea
          defaultValue={c.data.gifts}
          onBlur={(e) => {
            if (e.target.value !== c.data.gifts)
              run(
                workspace.save({
                  ...c,
                  data: { ...c.data, gifts: e.target.value },
                }),
              );
          }}
        />
      </Field>
      <Field label={`Log a check-in with ${c.title}`}>
        <input
          placeholder="Brief note, then press Enter"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.currentTarget.value.trim()) {
              const note = e.currentTarget.value;
              e.currentTarget.value = '';
              run(log(note));
            }
          }}
        />
      </Field>
      <button type="button" onClick={() => run(log('Checked in'))}>
        Log check-in today
      </button>
      <details>
        <summary>Contact history</summary>
        {c.data.logs.map((entry, i) => (
          <p key={i}>
            {entry.date} · {entry.note}
          </p>
        ))}
      </details>
      <DeleteRecord record={c} />
    </div>
  );
}
