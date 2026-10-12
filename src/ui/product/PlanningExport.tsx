import { useState } from 'react';
import { planningRows } from '../../domain/product/billing';
import { reportCsv } from '../../domain/product/receipts';
import { downloadBackup } from '../local/runtime';
import { Field } from './Common';
import { entities, run, useProduct } from './state';
import s from './product.module.css';
export function PlanningExport() {
  const { today, profile } = useProduct();
  const [start, setStart] = useState(today.slice(0, 8) + '01'),
    [end, setEnd] = useState(today);
  const rows = planningRows(entities('purchase'), start, end, profile.currency);
  return (
    <div className={s.form}>
      <p>
        Compare planned and final cost, variance, status, and scenario.
        Unpurchased items have no actual cost. Emotional tags are excluded.
      </p>
      <Field label="Planning report from">
        <input
          type="date"
          value={start}
          onChange={(e) => setStart(e.target.value)}
        />
      </Field>
      <Field label="Planning report to">
        <input
          type="date"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
        />
      </Field>
      <p>{rows.length - 1} purchases</p>
      <div className={s.actions}>
        <button
          type="button"
          disabled={start > end}
          onClick={() =>
            downloadBackup(reportCsv(rows), 'catalyst-planning.csv')
          }
        >
          Export planning CSV
        </button>
        <button
          type="button"
          disabled={start > end}
          onClick={() =>
            run(
              import('write-excel-file').then(async ({ default: write }) => {
                await write(
                  rows.map((row) =>
                    row.map((value) => ({
                      type: String,
                      value: String(value ?? ''),
                    })),
                  ),
                  { fileName: 'catalyst-planning.xlsx' },
                );
              }),
            )
          }
        >
          Export planning Excel
        </button>
      </div>
    </div>
  );
}
