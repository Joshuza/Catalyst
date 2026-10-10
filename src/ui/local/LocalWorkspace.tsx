import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { dietaryCheck } from '../../domain/product/food';
import type { UserRecord } from '../../domain/records';
import { MAX_BACKUP_BYTES } from '../../data/backup';
import type { QuickAction } from '../../engine/search';
import { workspace, downloadBackup } from './runtime';
import { Modal } from './Modal';
import { Spotlight } from './Spotlight';
import { RecordDetail } from './RecordDetail';
import { DynamicButton } from './DynamicButton';
import styles from './local.module.css';

function editable(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (!!target.closest('input, textarea, select') || target.isContentEditable)
  );
}
export function LocalWorkspace({
  visible = true,
  onOpenModule,
}: {
  visible?: boolean;
  onOpenModule?: (record: Extract<UserRecord, { kind: 'module' }>) => void;
}) {
  const state = useSyncExternalStore(
    workspace.subscribe,
    workspace.getSnapshot,
  );
  const [overlay, setOverlay] = useState<'search' | 'shortcuts' | null>(null);
  const [detail, setDetail] = useState<UserRecord | null>(null);
  const [localError, setLocalError] = useState('');
  const file = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<File | null>(null);
  const records = state.records
    .filter(
      (record) =>
        !record.deletedAt &&
        record.kind !== 'settings' &&
        record.kind !== 'module' &&
        (record.kind !== 'recipe' ||
          dietaryCheck(record, workspace.profile.dietary).allowed),
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const hasSamples = state.records.some(
    (record) => !record.deletedAt && !!record.sampleSet,
  );
  const mac = /Mac|iPhone|iPad/.test(navigator.platform);
  const modifier = mac ? 'Cmd' : 'Ctrl';
  useEffect(() => {
    void workspace.initialize().catch(() => undefined);
  }, []);
  useEffect(() => {
    if (!state.notice) return;
    const timer = setTimeout(() => workspace.clearNotice(), 5000);
    return () => clearTimeout(timer);
  }, [state.notice]);
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if (document.querySelector('dialog[data-required="true"][open]')) return;
      if (!(event.metaKey || event.ctrlKey) || event.altKey) return;
      if (event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (state.ready && !pendingImport) {
          setDetail(null);
          setOverlay('search');
        }
      }
      if (event.key.toLowerCase() === 'z' && !editable(event.target)) {
        event.preventDefault();
        if (!state.busy)
          void workspace
            .history(event.shiftKey ? 'redo' : 'undo')
            .catch(() => undefined);
      }
    };
    window.addEventListener('keydown', shortcut);
    return () => window.removeEventListener('keydown', shortcut);
  }, [state.ready, state.busy, pendingImport]);
  const create = (kind: 'note' | 'task' | 'transaction') => {
    setOverlay(null);
    setDetail(workspace.draft(kind));
  };
  const exportFile = (month?: number) => {
    try {
      downloadBackup(workspace.backup(month));
    } catch (error) {
      setLocalError(
        error instanceof Error
          ? error.message
          : 'The backup could not be exported.',
      );
    }
  };
  const action = (value: QuickAction) => {
    if (value.kind === 'export') {
      exportFile(value.month);
      setOverlay(null);
    } else create(value.kind);
  };
  return (
    <>
      <section
        hidden={!visible}
        className={styles.workspace}
        aria-label="Local records"
      >
        <div className={styles.heading}>
          <div>
            <p className={styles.meta}>YOUR RECORDS / ON THIS DEVICE</p>
            <h2>Your local records.</h2>
          </div>
          <span className={styles.hint}>
            {records.length} {records.length === 1 ? 'record' : 'records'}
            {hasSamples ? ' · Sample data loaded' : ''}
          </span>
        </div>
        <p>Keep notes and transactions locally. Search them from any page.</p>
        <div className={styles.actions}>
          <button
            type="button"
            data-workspace-trigger
            disabled={!state.ready || state.busy}
            onClick={() => setOverlay('search')}
          >
            Search <kbd>{modifier}+K</kbd>
          </button>
          <DynamicButton
            disabled={!state.ready || state.busy}
            onClick={() => create('note')}
          >
            New note
          </DynamicButton>
          <button
            type="button"
            disabled={!state.ready || state.busy}
            onClick={() => create('transaction')}
          >
            New transaction
          </button>
          <button type="button" onClick={() => setOverlay('shortcuts')}>
            Shortcuts
          </button>
          <button
            type="button"
            disabled={!state.canUndo || state.busy}
            onClick={() => {
              void workspace.history('undo').catch(() => undefined);
            }}
          >
            Undo
          </button>
          <button
            type="button"
            disabled={!state.canRedo || state.busy}
            onClick={() => {
              void workspace.history('redo').catch(() => undefined);
            }}
          >
            Redo
          </button>
        </div>
        {!state.ready && !state.error && (
          <p role="status">Opening local storage.</p>
        )}
        {(state.error || localError) && (
          <p role="alert" className={styles.error}>
            {state.error || localError}
          </p>
        )}
        {state.issues.length > 0 && (
          <p role="alert" className={styles.error}>
            {state.issues.length} stored record
            {state.issues.length === 1 ? '' : 's'} could not be verified. They
            were kept unchanged and left out of search.
          </p>
        )}
        {records.length > 0 && (
          <ul className={styles.recordList} aria-label="Recent records">
            {records.slice(0, 6).map((record) => (
              <li key={record.id}>
                <button type="button" onClick={() => setDetail(record)}>
                  <span>{record.title}</span>
                  <small>
                    {record.kind}
                    {record.sampleSet ? ' · Sample' : ''}
                  </small>
                </button>
              </li>
            ))}
          </ul>
        )}
        <details className={styles.tools}>
          <summary>Data and backups</summary>
          <div className={styles.actions}>
            <button
              type="button"
              disabled={!state.ready || state.busy}
              onClick={() => {
                void (
                  hasSamples
                    ? workspace.removeSamples()
                    : workspace.loadSamples()
                ).catch(() => undefined);
              }}
            >
              {hasSamples ? 'Remove sample data' : 'Load sample data'}
            </button>
            <button
              type="button"
              disabled={!state.ready || state.busy || state.issues.length > 0}
              onClick={() => exportFile()}
            >
              Export JSON backup
            </button>
            <button
              type="button"
              disabled={!state.ready || state.busy}
              onClick={() => file.current?.click()}
            >
              Import JSON backup
            </button>
          </div>
          <p className={styles.hint}>
            Sample data is optional and removable. Exported JSON contains
            readable personal data, including deleted records. Keep the file
            somewhere private.
          </p>
          <p className={styles.hint}>
            Sensitive fields are encrypted in browser storage. This does not
            protect against access to your unlocked browser. Backups are limited
            to 128 MB.
          </p>
          <input
            ref={file}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={(event) => {
              const incoming = event.target.files?.[0];
              event.target.value = '';
              if (incoming && incoming.size <= MAX_BACKUP_BYTES) {
                setLocalError('');
                setPendingImport(incoming);
              } else setLocalError('Choose a JSON backup smaller than 128 MB.');
            }}
          />
        </details>
      </section>
      {state.notice && (
        <div className={styles.toast} role="status">
          <span>{state.notice}</span>
          {state.canUndo && (
            <button
              type="button"
              disabled={state.busy}
              onClick={() => {
                void workspace.history('undo').catch(() => undefined);
              }}
            >
              Undo change
            </button>
          )}
        </div>
      )}
      {overlay === 'search' && (
        <Spotlight
          onClose={() => setOverlay(null)}
          onOpen={(record) => {
            setOverlay(null);
            if (record.kind === 'module' && onOpenModule) onOpenModule(record);
            else setDetail(record);
          }}
          onAction={action}
        />
      )}
      {overlay === 'shortcuts' && (
        <Modal title="Keyboard shortcuts" onClose={() => setOverlay(null)}>
          <dl className={styles.shortcuts}>
            <dt>{modifier}+K</dt>
            <dd>Search this device</dd>
            <dt>{modifier}+Z</dt>
            <dd>Undo a record change</dd>
            <dt>Shift+{modifier}+Z</dt>
            <dd>Redo a record change</dd>
            <dt>Enter / arrows in search</dt>
            <dd>Open / choose a result</dd>
            <dt>Tab</dt>
            <dd>Reach secondary actions</dd>
            <dt>Escape</dt>
            <dd>Close the overlay</dd>
            <dt>Hold Enter or Space</dt>
            <dd>Confirm deletion</dd>
          </dl>
          <p className={styles.hint}>
            Text-field undo uses the browser’s normal behavior.
          </p>
        </Modal>
      )}
      {detail && (
        <RecordDetail
          key={detail.id}
          initial={detail}
          onClose={() => setDetail(null)}
          busy={state.busy}
          saved={state.records.some(
            (record) => record.id === detail.id && !record.deletedAt,
          )}
        />
      )}
      {pendingImport && (
        <Modal title="Import backup" onClose={() => setPendingImport(null)}>
          <p>
            Merge {pendingImport.name} into this device? Matching IDs are
            updated. Other records are kept. The entire import can be undone.
          </p>
          <div className={styles.actions}>
            <DynamicButton
              disabled={state.busy}
              onClick={() => {
                void pendingImport
                  .text()
                  .then((text) => workspace.restore(text))
                  .then(() => setPendingImport(null))
                  .catch(() => setPendingImport(null));
              }}
            >
              Import and merge
            </DynamicButton>
            <button type="button" onClick={() => setPendingImport(null)}>
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
