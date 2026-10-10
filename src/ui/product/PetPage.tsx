import { PetRhythm } from '../onboarding/PetRhythm';
import { useState } from 'react';
import { addDays, addMonths, daysBetween } from '../../domain/product/dates';
import type { DataOf } from '../../domain/product/model';
import { personalSlot } from '../../domain/product/schedule';
import { workspace } from '../local/runtime';
import { Page, Panel, Field, DeleteRecord } from './Common';
import { useProduct, entities, run } from './state';
import s from './product.module.css';
export function PetPage() {
  const { profile, today } = useProduct();
  const [title, setTitle] = useState(''),
    [date, setDate] = useState(addDays(today, 7)),
    [category, setCategory] = useState<DataOf<'pet'>['category']>('Vet'),
    [notes, setNotes] = useState(''),
    [weight, setWeight] = useState(1),
    [notice, setNotice] = useState('');
  if (!profile.petEnabled) return null;
  const age = profile.petBirthdate
    ? Math.floor(daysBetween(profile.petBirthdate, today) / 365.25)
    : null;
  return (
    <Page
      title={`${profile.petName || 'Your pet'}’s care`}
      subtitle={`${profile.petSpecies || 'Pet'}${age !== null ? ` · ${age} years old` : ''}. Vet schedules, vaccinations, and food restocks in one timeline.`}
    >
      <div className={s.grid}>
        <Panel title="Care timeline" wide>
          {notice && <p role="status">{notice}</p>}
          {entities('pet')
            .sort((a, b) => a.data.date.localeCompare(b.data.date))
            .map((p) => (
              <div className={s.row} key={p.id}>
                <div>
                  <strong>{p.title}</strong>
                  <p className={s.muted}>
                    {p.data.category} · {p.data.date} · {p.data.notes}
                    {p.data.weightKg !== undefined
                      ? ` · ${p.data.weightKg} kg`
                      : null}
                  </p>
                </div>
                <label>
                  <input
                    type="checkbox"
                    checked={p.data.completed}
                    onChange={(e) =>
                      run(
                        workspace.save({
                          ...p,
                          data: { ...p.data, completed: e.target.checked },
                        }),
                      )
                    }
                  />
                  Done
                </label>
                {p.data.category === 'Food' && (
                  <button
                    type="button"
                    onClick={() =>
                      run(
                        workspace.save(
                          workspace.make(p.title, {
                            type: 'grocery',
                            name: p.title,
                            quantity: 1,
                            unit: 'pack',
                            section: 'Pet supplies',
                            checked: false,
                            tripId: null,
                          }),
                        ),
                      )
                    }
                  >
                    Add food to groceries
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const slot = personalSlot(
                      profile,
                      p.data.date,
                      entities('event').map((e) => e.data),
                      18,
                      30,
                    );
                    if (!slot) {
                      setNotice(
                        'No free time outside protected hours. Choose a time in Calendar.',
                      );
                      return;
                    }
                    run(
                      workspace.save(
                        workspace.make(p.title, {
                          type: 'event',
                          ...slot,
                          category: 'personal',
                          taskId: null,
                          travelMinutes: 0,
                          location: '',
                          ticket: 'none',
                          reference: '',
                        }),
                      ),
                    );
                  }}
                >
                  Add calendar reminder
                </button>
                <DeleteRecord record={p} />
              </div>
            ))}
        </Panel>
        <Panel title="Add care reminder">
          <form
            className={s.form}
            onSubmit={(e) => {
              e.preventDefault();
              run(
                workspace
                  .save(
                    workspace.make(title, {
                      type: 'pet',
                      category,
                      date,
                      notes,
                      completed: false,
                      ...(category === 'Weight' ? { weightKg: weight } : {}),
                    }),
                  )
                  .then(() => setTitle('')),
              );
            }}
          >
            <Field label="Care reminder title">
              <input
                value={title}
                maxLength={300}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Field>
            <Field label="Care category">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as typeof category)}
              >
                {['Vet', 'Vaccination', 'Food', 'Prescription', 'Weight'].map(
                  (v) => (
                    <option key={v}>{v}</option>
                  ),
                )}
              </select>
            </Field>
            <Field label="Care due date">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>
            {category === 'Weight' && (
              <Field label="Pet weight in kilograms">
                <input
                  type="number"
                  min=".01"
                  max="10000"
                  step=".01"
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                />
              </Field>
            )}
            <Field label="Care notes">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Field>
            <button
              type="submit"
              className={s.primary}
              disabled={!title.trim()}
            >
              Save care reminder
            </button>
          </form>
        </Panel>
        <PetRhythm />
        <Panel title="Age-aware reminders">
          <p className={s.muted}>
            Confirm clinical timing with your vet. These are planning prompts
            based on your pet profile.
          </p>
          <button
            type="button"
            onClick={() =>
              run(
                workspace.save(
                  workspace.make(
                    `Annual ${profile.petSpecies || 'pet'} wellness review`,
                    {
                      type: 'pet',
                      category: 'Vet',
                      date: profile.petBirthdate
                        ? addMonths(
                            profile.petBirthdate,
                            (Math.max(0, age ?? 0) + 1) * 12,
                          )
                        : addMonths(today, 12),
                      notes:
                        'Review vaccination and food needs with your veterinarian.',
                      completed: false,
                    },
                  ),
                ),
              )
            }
          >
            Add next birthday wellness review
          </button>
        </Panel>
      </div>
    </Page>
  );
}
