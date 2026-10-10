import { useState } from 'react';
import { focusCorrelation } from '../../domain/product/evolution';
import { correlation, parseCsv } from '../../domain/product/life';
import { moduleSchema } from '../../domain/product/model';
import { workspace } from '../local/runtime';
import { Page, Panel, Field, DeleteRecord } from './Common';
import { useProduct, entities, run } from './state';
import s from './product.module.css';
export function ScreenPage() {
  const { today } = useProduct();
  const [date, setDate] = useState(today),
    [hours, setHours] = useState(0),
    [focus, setFocus] = useState(0),
    [error, setError] = useState('');
  const samples = entities('screen').sort((a, b) =>
      a.updatedAt.localeCompare(b.updatedAt),
    ),
    stats = correlation(
      samples.map((v) => v.data),
      entities('purchase')
        .filter(
          (p) =>
            !p.data.currency || p.data.currency === workspace.profile.currency,
        )
        .map((p) => p.data),
    );
  const importCsv = async (file: File) => {
    try {
      if (file.size > 1024 * 1024) throw new Error('Choose a CSV under 1 MB.');
      const rows = parseCsv(await file.text());
      const header = rows.shift()?.map((v) => v.trim().toLowerCase()) ?? [];
      const dateIndex = header.indexOf('date'),
        hoursIndex = header.indexOf('hours'),
        focusIndex = header.indexOf('focushours');
      if (dateIndex < 0 || hoursIndex < 0)
        throw new Error('CSV needs date,hours,focusHours columns.');
      const records = rows.map((row) => {
        const data = moduleSchema.parse({
          type: 'screen',
          date: row[dateIndex],
          hours: Number(row[hoursIndex]),
          focusHours: focusIndex >= 0 ? Number(row[focusIndex]) : 0,
        });
        return workspace.make(`Screen time ${row[dateIndex]}`, data);
      });
      await workspace.commit('Screen time imported', records);
      setError('');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'The CSV could not be imported.',
      );
    }
  };
  return (
    <Page
      title="Screen time & patterns"
      subtitle="Observe screen use, focus, and spending without judgment. Manual entry and CSV import keep the data local."
    >
      <div className={s.grid}>
        <Panel title="Your observations">
          <p className={s.metric}>{samples.length} daily samples</p>
          {stats.r === null ? (
            <p className={s.empty}>
              No reliable pattern yet. Add at least seven dates with varied
              screen hours and purchase data.
            </p>
          ) : (
            <p className={s.alert}>
              Across {stats.count} recorded days, screen hours and
              impulsive-tagged spending have a correlation of{' '}
              {stats.r.toFixed(2)}. This describes association, not causation.
            </p>
          )}
          <p>
            {focusCorrelation(samples.map((s) => s.data)) === null
              ? 'Add seven varied samples to compare screen hours with focus hours.'
              : `Screen hours and focus hours have a correlation of ${focusCorrelation(samples.map((s) => s.data))!.toFixed(2)} across your recorded dates. Association does not imply causation.`}
          </p>
          <p className={s.muted}>
            Duplicate dates use the latest sample. Regret tags are not included
            in exports by default.
          </p>
        </Panel>
        <Panel title="Add daily sample">
          <form
            className={s.form}
            onSubmit={(e) => {
              e.preventDefault();
              run(
                workspace.save(
                  workspace.make(`Screen time ${date}`, {
                    type: 'screen',
                    date,
                    hours,
                    focusHours: focus,
                  }),
                ),
              );
            }}
          >
            <Field label="Screen sample date">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>
            <Field label="Screen hours">
              <input
                type="number"
                min="0"
                max="24"
                step=".1"
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
              />
            </Field>
            <Field label="Focus hours">
              <input
                type="number"
                min="0"
                max="24"
                step=".1"
                value={focus}
                onChange={(e) => setFocus(Number(e.target.value))}
              />
            </Field>
            <button type="submit" className={s.primary}>
              Save screen sample
            </button>
            <Field label="Import screen CSV">
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void importCsv(file);
                  e.target.value = '';
                }}
              />
            </Field>
            <p className={s.muted}>
              Header: date,hours,focusHours. OS-level synchronization is not
              connected.
            </p>
            {error && <p role="alert">{error}</p>}
          </form>
        </Panel>
        <Panel title="Daily history" wide>
          {samples
            .sort((a, b) => b.data.date.localeCompare(a.data.date))
            .map((v) => (
              <div className={s.row} key={v.id}>
                <span>{v.data.date}</span>
                <span>
                  {v.data.hours} hours screen · {v.data.focusHours} hours focus
                </span>
                <DeleteRecord record={v} />
              </div>
            ))}
        </Panel>
      </div>
    </Page>
  );
}
