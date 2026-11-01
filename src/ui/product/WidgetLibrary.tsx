import { useState } from 'react';
import { Modal } from '../local/Modal';
import { widgetCatalog, openWidget } from './widget-catalog';
import { useWidgetBoard } from './useWidgetBoard';
import { WidgetSizeControl } from './WidgetCard';
import { NavIcon } from './NavIcon';
import { money } from './state';
import s from './product.module.css';
import type { WidgetId, WidgetSize } from '../../domain/product/widgets';

export function WidgetLibrary({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [sizes, setSizes] = useState<Partial<Record<WidgetId, WidgetSize>>>({});
  const board = useWidgetBoard();
  const entries = widgetCatalog.filter(
    (entry) =>
      (entry.id !== 'pet' || board.petEnabled) &&
      `${entry.label} ${entry.group} ${board.summaries[entry.id].detail}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <Modal title="Widget library" onClose={onClose}>
      <div
        className={`${s.page} ${s.widgetLibrary}`}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            onClose();
          }
        }}
      >
        <p className={s.muted}>
          Every part of Catalyst, at a glance. Add only what you want to see
          each day.
        </p>
        {board.sample && <p className={s.badge}>Sample workspace</p>}
        <label className={s.field}>
          Find a widget
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <p className={s.muted} role="status">
          {entries.length} {entries.length === 1 ? 'widget' : 'widgets'}
        </p>
        <div className={s.libraryGrid}>
          {entries.map((entry) => {
            const summary = board.summaries[entry.id];
            return (
              <section
                key={entry.id}
                className={s.libraryCard}
                aria-label={`${entry.label} widget preview`}
              >
                <h3>
                  <NavIcon page={entry.id} />
                  {entry.label}
                </h3>
                <strong>
                  {summary.cents === undefined
                    ? summary.value
                    : money(summary.cents)}
                </strong>
                <p className={s.widgetSummary}>{summary.detail}</p>
                <WidgetSizeControl
                  disabled={board.busy}
                  id={entry.id}
                  size={sizes[entry.id] ?? board.sizeOf(entry.id)}
                  onChange={(size) =>
                    board.active(entry.id)
                      ? board.update(entry.id, size)
                      : setSizes((current) => ({
                          ...current,
                          [entry.id]: size,
                        }))
                  }
                />
                <div className={s.actions}>
                  <button
                    type="button"
                    aria-label={`Open ${entry.label} widget`}
                    onClick={() => {
                      onClose();
                      openWidget(entry.id);
                    }}
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    aria-pressed={board.active(entry.id)}
                    disabled={board.busy || board.locked(entry.id)}
                    title={
                      board.locked(entry.id)
                        ? 'Unpin this section in dashboard customization first.'
                        : undefined
                    }
                    onClick={() =>
                      board.update(
                        entry.id,
                        sizes[entry.id],
                        board.active(entry.id),
                      )
                    }
                  >
                    {board.active(entry.id)
                      ? 'Remove from dashboard'
                      : 'Add to dashboard'}
                  </button>
                </div>
              </section>
            );
          })}
        </div>
        {!entries.length && (
          <p className={s.empty}>
            No widgets match. Try a module name or clear your search.
          </p>
        )}
      </div>
    </Modal>
  );
}
