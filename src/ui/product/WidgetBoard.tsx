import { useEffect, useState } from 'react';
import { coreWidgets } from '../../domain/product/widgets';
import { WidgetCard, WidgetSizeControl } from './WidgetCard';
import { WidgetLibrary } from './WidgetLibrary';
import { useWidgetBoard } from './useWidgetBoard';
import { restoreWidgetFocus, widgetLabel } from './widget-catalog';
import s from './product.module.css';

export function WidgetBoard({
  customizing,
  children,
  enabled = true,
  sections = [],
}: {
  customizing: boolean;
  children: React.ReactNode;
  enabled?: boolean;
  sections?: string[];
}) {
  const board = useWidgetBoard();
  const [library, setLibrary] = useState(false);
  useEffect(() => {
    if (enabled) restoreWidgetFocus();
  }, [enabled]);
  useEffect(() => {
    const open = () => setLibrary(true);
    window.addEventListener('catalyst:widgets', open);
    return () => window.removeEventListener('catalyst:widgets', open);
  }, []);
  if (!enabled) return <>{children}</>;
  return (
    <>
      {board.sample && <p className={s.badge}>Sample workspace</p>}
      <div className={s.widgetCanvas} data-widget-canvas>
        {children}
        {board.layout
          .filter(
            (item) =>
              !coreWidgets.includes(item.id) && !sections.includes(item.id),
          )
          .map((item) => (
            <WidgetCard
              key={item.id}
              id={item.id}
              size={item.size}
              summary={board.summaries[item.id]}
            >
              {customizing && (
                <div className={s.widgetEdit}>
                  <WidgetSizeControl
                    disabled={board.busy}
                    id={item.id}
                    size={item.size}
                    onChange={(size) => board.update(item.id, size)}
                  />
                  <button
                    type="button"
                    disabled={board.busy}
                    aria-label={`Remove ${widgetLabel(item.id)} widget`}
                    onClick={() => board.update(item.id, undefined, true)}
                  >
                    Remove
                  </button>
                </div>
              )}
            </WidgetCard>
          ))}
      </div>
      {customizing && (
        <div className={s.coreSizes}>
          {coreWidgets.filter(board.active).map((id) => (
            <WidgetSizeControl
              disabled={board.busy}
              key={id}
              id={id}
              size={board.sizeOf(id)}
              onChange={(size) => board.update(id, size)}
            />
          ))}
        </div>
      )}
      {library && <WidgetLibrary onClose={() => setLibrary(false)} />}
    </>
  );
}
