import { Field } from './Common';
import s from './product.module.css';
export const bands = ['30 minutes', 'Hourly', 'Pacing', 'Working week'];
export function CalendarZoom({
  zoom,
  singleDay,
  pacingHours,
  setZoom,
  setSingleDay,
  setPacingHours,
}: {
  zoom: number;
  singleDay: boolean;
  pacingHours: number;
  setZoom: (v: number) => void;
  setSingleDay: (v: boolean) => void;
  setPacingHours: (v: number) => void;
}) {
  return (
    <div className={s.actions}>
      <div className={s.chips}>
        {bands.map((b, i) => (
          <button
            key={b}
            type="button"
            aria-pressed={zoom === i && !singleDay}
            onClick={() => {
              setZoom(i);
              setSingleDay(false);
            }}
          >
            {b}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={singleDay}
          onClick={() => {
            setSingleDay(true);
            setZoom(3);
          }}
        >
          1 Day
        </button>
      </div>
      {zoom === 2 && (
        <Field label="Pacing interval">
          <select
            value={pacingHours}
            onChange={(e) => setPacingHours(Number(e.target.value))}
          >
            {[3, 6, 12].map((h) => (
              <option value={h} key={h}>
                {h} hours
              </option>
            ))}
          </select>
        </Field>
      )}
    </div>
  );
}
