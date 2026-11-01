import type { WidgetId, WidgetSize } from '../../domain/product/widgets';
import type { WidgetSummary } from '../../domain/product/widget-summaries';
import { widgetSizes } from '../../domain/product/widgets';
import { money } from './state';
import { NavIcon } from './NavIcon';
import { openWidget, widgetLabel } from './widget-catalog';
import s from './product.module.css';
import { WidgetGlyph } from './WidgetGlyph';

export function WidgetCard({
  id,
  size,
  summary,
  children,
}: {
  id: WidgetId;
  size: WidgetSize;
  summary: WidgetSummary;
  children?: React.ReactNode;
}) {
  const label = widgetLabel(id);
  return (
    <article
      className={s.widgetCard}
      data-widget-id={id}
      data-widget-size={size}
      aria-label={`${label} widget`}
    >
      <button
        type="button"
        className={s.widgetLaunch}
        aria-label={`Open ${label} widget`}
        onClick={() => openWidget(id)}
      >
        <span className={s.widgetHeading}>
          <span className={s.widgetIcon}>
            <NavIcon page={id} />
          </span>
          <span>{label}</span>
          <span className={s.widgetArrow} aria-hidden="true">
            <WidgetGlyph />
          </span>
        </span>
        <strong className={s.widgetValue}>
          {summary.cents === undefined ? summary.value : money(summary.cents)}
        </strong>
        <span className={s.widgetSummary}>{summary.detail}</span>
        <span className={s.widgetHint}>
          Open workspace <WidgetGlyph />
        </span>
      </button>
      {children}
    </article>
  );
}
export function WidgetSizeControl({
  id,
  size,
  onChange,
  disabled = false,
}: {
  id: WidgetId;
  size: WidgetSize;
  onChange: (size: WidgetSize) => void;
  disabled?: boolean;
}) {
  return (
    <label className={s.widgetSizeControl}>
      Size
      <select
        disabled={disabled}
        aria-label={`Size of ${widgetLabel(id)} widget`}
        value={size}
        onChange={(event) => onChange(event.target.value as WidgetSize)}
      >
        {widgetSizes.map((value) => (
          <option key={value} value={value}>
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </option>
        ))}
      </select>
    </label>
  );
}
