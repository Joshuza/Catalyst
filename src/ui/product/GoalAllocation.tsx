import { useState } from 'react';
import { workspace } from '../local/runtime';
import { Field, MoneyField } from './Common';
import type { Entity } from './state';
import s from './product.module.css';
export function GoalAllocation({
  goal,
  available,
}: {
  goal: Entity<'goal'>;
  available: number;
}) {
  const [reserved, setReserved] = useState(goal.data.reservedCents),
    [target, setTarget] = useState(goal.data.targetCents),
    [date, setDate] = useState(goal.data.date),
    [notice, setNotice] = useState('');
  return (
    <details>
      <summary>Adjust your goal</summary>
      <form
        className={s.form}
        onSubmit={(e) => {
          e.preventDefault();
          if (reserved > available) {
            setNotice(
              'This reservation exceeds your available verified balance.',
            );
            return;
          }
          void workspace
            .save({
              ...goal,
              data: {
                ...goal.data,
                targetCents: target,
                reservedCents: reserved,
                date,
              },
            })
            .then(() => setNotice('Goal updated.'))
            .catch((e) =>
              setNotice(
                e instanceof Error ? e.message : 'Goal could not be updated.',
              ),
            );
        }}
      >
        <MoneyField
          label={`Target for ${goal.title}`}
          cents={target}
          onChange={setTarget}
          allowZero={false}
        />
        <MoneyField
          label={`Reservation for ${goal.title}`}
          cents={reserved}
          onChange={setReserved}
        />
        <Field label={`Target date for ${goal.title}`}>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>
        <button className={s.primary}>Update goal</button>
        {notice && <p role="status">{notice}</p>}
      </form>
    </details>
  );
}
