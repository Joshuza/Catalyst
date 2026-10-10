import { useState } from 'react';
import type { Entity } from './state';
import { workspace } from '../local/runtime';
import { Field, MoneyField } from './Common';
import s from './product.module.css';
export function ResearchDetails({ record }: { record: Entity<'research'> }) {
  const [cost, setCost] = useState(record.data.costCents),
    [pros, setPros] = useState(record.data.pros),
    [cons, setCons] = useState(record.data.cons),
    [body, setBody] = useState(record.data.body),
    [priority, setPriority] = useState(record.data.priority),
    [error, setError] = useState('');
  return (
    <details>
      <summary>Edit notes, pros, cons & estimate</summary>
      <form
        className={s.form}
        onSubmit={(e) => {
          e.preventDefault();
          void workspace
            .save({
              ...record,
              data: {
                ...record.data,
                costCents: cost,
                pros,
                cons,
                body,
                priority,
              },
            })
            .then(() => setError('Details saved.'))
            .catch((e) =>
              setError(
                e instanceof Error ? e.message : 'Details could not be saved.',
              ),
            );
        }}
      >
        <Field label={`Notes for ${record.title}`}>
          <textarea
            maxLength={20000}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </Field>
        <Field label={`Pros for ${record.title}`}>
          <textarea
            maxLength={20000}
            value={pros}
            onChange={(e) => setPros(e.target.value)}
          />
        </Field>
        <Field label={`Cons for ${record.title}`}>
          <textarea
            maxLength={20000}
            value={cons}
            onChange={(e) => setCons(e.target.value)}
          />
        </Field>
        <Field label={`Priority for ${record.title}`}>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as typeof priority)}
          >
            {['Researching', 'Nice to have', 'Must have'].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </Field>
        <MoneyField
          label={`Cost for ${record.title}`}
          cents={cost}
          onChange={setCost}
        />
        <button className={s.primary}>Save research details</button>
        {error && <p role="status">{error}</p>}
      </form>
    </details>
  );
}
