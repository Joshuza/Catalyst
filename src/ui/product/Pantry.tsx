import { useState } from 'react';
import { workspace } from '../local/runtime';
import { Panel, Field, DeleteRecord } from './Common';
import { entities, run } from './state';
import s from './product.module.css';
export function Pantry() {
  const [pantryName, setPantryName] = useState(''),
    [pantryQty, setPantryQty] = useState(0),
    [pantryUnit, setPantryUnit] = useState('g');
  return (
    <Panel title="Your pantry">
      <div className={s.form}>
        <Field label="Pantry ingredient">
          <input
            value={pantryName}
            maxLength={300}
            onChange={(e) => setPantryName(e.target.value)}
          />
        </Field>
        <div className={s.pair}>
          <Field label="Pantry quantity">
            <input
              type="number"
              min="0"
              value={pantryQty}
              onChange={(e) => setPantryQty(Number(e.target.value))}
            />
          </Field>
          <Field label="Pantry unit">
            <input
              value={pantryUnit}
              onChange={(e) => setPantryUnit(e.target.value)}
            />
          </Field>
        </div>
        <button
          type="button"
          disabled={!pantryName.trim()}
          onClick={() =>
            run(
              workspace
                .save(
                  workspace.make(pantryName, {
                    type: 'pantry',
                    name: pantryName,
                    quantity: pantryQty,
                    unit: pantryUnit,
                  }),
                )
                .then(() => setPantryName('')),
            )
          }
        >
          Add pantry item
        </button>
      </div>
      {entities('pantry').map((p) => (
        <div className={s.row} key={p.id}>
          <span>
            {p.data.quantity} {p.data.unit} {p.data.name}
          </span>
          <DeleteRecord record={p} />
        </div>
      ))}
      <p className={s.muted}>
        Totals use normalized units, merge duplicate ingredients, and subtract
        pantry quantities. Purchases are logged separately in Financial Core.
      </p>
    </Panel>
  );
}
