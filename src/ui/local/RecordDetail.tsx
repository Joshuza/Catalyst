import { useState, type FormEvent } from 'react';
import { parseMoney } from '../../domain/money';
import {
  recordSchema,
  recordText,
  type UserRecord,
} from '../../domain/records';
import { Modal } from './Modal';
import { DynamicButton } from './DynamicButton';
import { HoldToConfirmButton } from './HoldToConfirmButton';
import { workspace } from './runtime';
import styles from './local.module.css';

export function RecordDetail({
  initial,
  onClose,
  busy,
  saved,
}: {
  initial: UserRecord;
  onClose: () => void;
  busy: boolean;
  saved: boolean;
}) {
  const [draft, setDraft] = useState(initial);
  const [amount, setAmount] = useState(
    initial.kind === 'transaction'
      ? new Intl.NumberFormat(workspace.locale, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(initial.amountCents / 100)
      : '',
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const editable = ['note', 'task', 'transaction'].includes(draft.kind);
  const field = (values: Partial<UserRecord>) => {
    setDraft({ ...draft, ...values } as UserRecord);
    setSuccess(false);
  };
  async function save(event: FormEvent) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      const value = recordSchema.parse(
        draft.kind === 'transaction'
          ? { ...draft, amountCents: parseMoney(amount, workspace.locale) }
          : draft,
      );
      setDraft(await workspace.save(value));
      setSuccess(true);
    } catch (failure) {
      setError(
        failure instanceof Error && failure.name !== 'ZodError'
          ? failure.message
          : 'Check the title, amount, currency, and date. Nothing was saved.',
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <Modal title={saved ? 'Record detail' : 'New record'} onClose={onClose}>
      <p className={styles.meta}>
        {draft.sampleSet ? 'Sample / ' : ''}
        {draft.kind} · On this device
      </p>
      {editable ? (
        <form
          onSubmit={(event) => {
            void save(event);
          }}
          className={styles.form}
        >
          <label>
            Title
            <input
              autoFocus
              required
              maxLength={300}
              value={draft.title}
              onChange={(event) => field({ title: event.target.value })}
            />
          </label>
          {draft.kind === 'note' && (
            <label>
              Note
              <textarea
                maxLength={20000}
                value={draft.body}
                onChange={(event) => field({ body: event.target.value })}
              />
            </label>
          )}
          {draft.kind === 'task' && (
            <>
              <label>
                Task notes
                <textarea
                  maxLength={20000}
                  value={draft.notes}
                  onChange={(event) => field({ notes: event.target.value })}
                />
              </label>
              <label className={styles.inline}>
                <input
                  type="checkbox"
                  checked={draft.completed}
                  onChange={(event) =>
                    field({ completed: event.target.checked })
                  }
                />
                Completed
              </label>
            </>
          )}
          {draft.kind === 'transaction' && (
            <>
              <div className={styles.fieldPair}>
                <label>
                  Amount
                  <input
                    inputMode="decimal"
                    required
                    value={amount}
                    onChange={(event) => {
                      setAmount(event.target.value);
                      setSuccess(false);
                    }}
                  />
                </label>
                <label>
                  Currency
                  <input
                    required
                    maxLength={3}
                    pattern="[A-Z]{3}"
                    value={draft.currency}
                    onChange={(event) =>
                      field({ currency: event.target.value.toUpperCase() })
                    }
                  />
                </label>
              </div>
              <p className={styles.hint}>
                Use a negative amount for an expense and a positive amount for
                income.
              </p>
              <label>
                Date
                <input
                  required
                  type="date"
                  value={draft.date}
                  onChange={(event) => field({ date: event.target.value })}
                />
              </label>
              <label>
                Category
                <input
                  maxLength={100}
                  value={draft.category}
                  onChange={(event) => field({ category: event.target.value })}
                />
              </label>
              <label>
                Receipt file name
                <input
                  maxLength={300}
                  value={draft.receiptFile ?? ''}
                  onChange={(event) =>
                    field({ receiptFile: event.target.value || null })
                  }
                />
              </label>
            </>
          )}
          {error && (
            <p role="alert" className={styles.error}>
              {error}
            </p>
          )}
          <div className={styles.actions}>
            <DynamicButton type="submit" disabled={busy || saving}>
              {saving ? 'Saving' : success ? 'Saved' : 'Save record'}
            </DynamicButton>
            <span role="status">{success ? 'Saved on this device.' : ''}</span>
          </div>
        </form>
      ) : (
        <div className={styles.readOnly}>
          <h3>{draft.title}</h3>
          <p>{recordText(draft)}</p>
          {draft.kind === 'message' && (
            <p>
              {draft.date} · {draft.unread ? 'Unread' : 'Read'} · {draft.stream}
            </p>
          )}
        </div>
      )}
      {(saved || success) && (
        <div className={styles.deleteArea}>
          <HoldToConfirmButton
            disabled={busy}
            onConfirm={async () => {
              await workspace.remove(draft);
              onClose();
            }}
          />
        </div>
      )}
    </Modal>
  );
}
