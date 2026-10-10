import { useMemo, useState } from 'react';
import type { UserRecord } from '../../domain/records';
import { formatMoney } from '../../domain/money';
import { quickActions, type QuickAction } from '../../engine/search';
import { workspace } from './runtime';
import { Modal } from './Modal';
import styles from './local.module.css';

export function Spotlight({
  onClose,
  onOpen,
  onAction,
}: {
  onClose: () => void;
  onOpen: (record: UserRecord) => void;
  onAction: (action: QuickAction) => void;
}) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const [copyStatus, setCopyStatus] = useState('');
  const results = useMemo(() => {
    try {
      return { hits: workspace.search.search(query), error: '' };
    } catch {
      return { hits: [], error: 'Check the amount in your search.' };
    }
  }, [query]);
  const actions = quickActions(query);
  const groups = workspace.search.groups(results.hits);
  return (
    <Modal title="Search this device" onClose={onClose}>
      <label className={styles.searchLabel}>
        Search records
        <input
          autoFocus
          type="search"
          value={query}
          placeholder="receipts over $100 in October"
          maxLength={500}
          aria-controls="search-results"
          onChange={(event) => {
            setQuery(event.target.value);
            setSelected(0);
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault();
              setSelected((current) =>
                Math.max(
                  0,
                  Math.min(
                    results.hits.length - 1,
                    current + (event.key === 'ArrowDown' ? 1 : -1),
                  ),
                ),
              );
            }
            if (event.key === 'Enter') {
              event.preventDefault();
              const hit = results.hits[selected];
              if (hit) onOpen(hit.record);
              else if (actions[0]) onAction(actions[0]);
            }
          }}
        />
      </label>
      <p className={styles.hint}>
        Enter opens the highlighted result. Arrow keys choose a result. Tab
        reaches its actions.
      </p>
      <p className={styles.hint}>
        Try “receipt” or “unread from Maria”. Results stay on this device.
      </p>
      <div id="search-results" className={styles.results}>
        {results.error && <p role="alert">{results.error}</p>}
        {!results.hits.length && !results.error && (
          <p>
            No matching records. Create a note or load Sample data from the
            canvas.
          </p>
        )}
        {Object.entries(groups).map(([kind, hits]) => (
          <section key={kind} aria-label={`${kind} results`}>
            <h3 className={styles.groupTitle}>{kind}</h3>
            {hits.map(({ record }) => (
              <div
                key={record.id}
                className={`${styles.result} ${record.id === results.hits[selected]?.record.id ? styles.highlight : ''}`}
              >
                <button type="button" onClick={() => onOpen(record)}>
                  <span>{record.title}</span>
                  <small>
                    {record.kind === 'transaction'
                      ? `${formatMoney(record.amountCents, workspace.locale, record.currency)} · ${record.date}`
                      : record.kind === 'message'
                        ? `${record.sender} · ${record.unread ? 'Unread' : 'Read'}`
                        : record.kind}
                  </small>
                </button>
                {record.kind === 'transaction' && (
                  <button
                    type="button"
                    className={styles.secondaryAction}
                    aria-label={`Copy amount for ${record.title}`}
                    onClick={() => {
                      void navigator.clipboard
                        .writeText(
                          formatMoney(
                            record.amountCents,
                            workspace.locale,
                            record.currency,
                          ),
                        )
                        .then(() => setCopyStatus('Amount copied.'))
                        .catch(() =>
                          setCopyStatus('Copy is unavailable in this browser.'),
                        );
                    }}
                  >
                    Copy amount
                  </button>
                )}
              </div>
            ))}
          </section>
        ))}
        {!!actions.length && (
          <section aria-label="Quick actions">
            <h3 className={styles.groupTitle}>Actions</h3>
            {actions.map((action) => (
              <button
                className={styles.quick}
                type="button"
                key={action.label}
                onClick={() => onAction(action)}
              >
                {action.label}
              </button>
            ))}
          </section>
        )}
      </div>
      <p role="status" className={styles.hint}>
        {copyStatus || `${results.hits.length} results`}
      </p>
    </Modal>
  );
}
