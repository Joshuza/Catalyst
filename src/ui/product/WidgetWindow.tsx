import { useMemo } from 'react';
import { widgetIds, type WidgetId } from '../../domain/product/widgets';
import { summarizeWidgets } from '../../domain/product/widget-summaries';
import { useProduct, navigate, money } from './state';
import { widgetLabel } from './widget-catalog';
import { NavIcon } from './NavIcon';
import s from './product.module.css';
import { WidgetGlyph } from './WidgetGlyph';

export function WidgetWindow({
  page,
  maximized,
  onMaximize,
}: {
  page: string;
  maximized: boolean;
  onMaximize: () => void;
}) {
  const { records, profile, today, deep } = useProduct();
  const id: WidgetId =
    page === 'briefing-detail'
      ? 'briefing'
      : widgetIds.includes(page as WidgetId)
        ? (page as WidgetId)
        : 'profile';
  const summary = useMemo(
    () => summarizeWidgets(records, profile, today, deep)[id],
    [records, profile, today, deep, id],
  );
  return (
    <header
      className={s.windowBar}
      aria-label={`${widgetLabel(id)} window controls`}
    >
      <button
        type="button"
        aria-label={`Close ${widgetLabel(id)} window`}
        title="Back to dashboard"
        onClick={() => navigate('briefing')}
      >
        <WidgetGlyph kind="close" />
      </button>
      <span className={s.windowIcon}>
        <NavIcon page={id} />
      </span>
      <div className={s.windowSummary}>
        <strong>{widgetLabel(id)}</strong>
        <p>
          {records.some((record) => !record.deletedAt && !!record.sampleSet)
            ? 'Sample · '
            : ''}
          {summary.cents === undefined ? summary.value : money(summary.cents)} ·{' '}
          {summary.detail}
        </p>
      </div>
      <button
        type="button"
        aria-label={maximized ? 'Restore window size' : 'Maximize window'}
        aria-pressed={maximized}
        onClick={onMaximize}
      >
        <WidgetGlyph kind={maximized ? 'restore' : 'expand'} />
      </button>
    </header>
  );
}
