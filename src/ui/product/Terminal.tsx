import { useMemo, useState, useEffect } from 'react';
import { parseCommand } from '../../engine/product/terminal';
import { timeLabel } from '../../domain/product/dates';
import { emptyTaskDetails } from '../../domain/product/model';
import { protectedTime } from '../../domain/product/schedule';
import { workspace } from '../local/runtime';
import { Modal } from '../local/Modal';
import { DynamicButton } from '../local/DynamicButton';
import { Field } from './Common';
import { useProduct, money, navigate, focusCalendar } from './state';
import { ReceiptPrinter } from './Animations';
import s from './product.module.css';
const history: string[] = [];
export function Terminal({ onClose }: { onClose: () => void }) {
  const { today, profile, busy } = useProduct();
  const [input, setInput] = useState(''),
    [date, setDate] = useState(''),
    [confirmCore, setConfirmCore] = useState(false),
    [historyIndex, setHistoryIndex] = useState(0),
    [error, setError] = useState(''),
    [receipt, setReceipt] = useState<{
      title: string;
      cents: number;
      planned: boolean;
    } | null>(null);
  useEffect(() => {
    if (!receipt) return;
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [receipt, onClose]);
  const parsed = useMemo(() => {
    try {
      return parseCommand(input, today, profile, date || undefined);
    } catch {
      return null;
    }
  }, [input, today, profile, date]);
  const protectedSlot =
    parsed?.intent === 'event' &&
    protectedTime(profile, {
      date: parsed.date,
      start: parsed.hour,
      minutes: 60,
    });
  const confirm = async () => {
    if (
      !parsed ||
      parsed.question ||
      !parsed.title ||
      busy ||
      (protectedSlot && !confirmCore)
    )
      return;
    try {
      if (parsed.intent === 'purchase') {
        const purchase = workspace.make(parsed.title, {
          type: 'purchase',
          costCents: parsed.cents,
          date: parsed.date,
          status: parsed.bought ? 'bought' : 'planned',
          scenario: 'Main',
          actualCents: parsed.bought ? parsed.cents : null,
          regret: null,
          emotion: null,
          transactionId: null,
        });
        if (parsed.bought) {
          const t = {
            ...workspace.draft('transaction'),
            title: parsed.title,
            amountCents: -parsed.cents,
            date: parsed.date,
            currency: profile.currency,
            category: 'Purchase',
            receiptFile: null,
          };
          if (purchase.data.type === 'purchase')
            purchase.data.transactionId = t.id;
          await workspace.commit('Record purchase', [purchase, t]);
        } else await workspace.save(purchase);
        setReceipt({
          title: parsed.title,
          cents: parsed.cents,
          planned: !parsed.bought,
        });
        navigate('finance');
      } else if (parsed.intent === 'event') {
        await workspace.save(
          workspace.make(parsed.title, {
            type: 'event',
            date: parsed.date,
            start: parsed.hour,
            minutes: 60,
            category: 'personal',
            taskId: null,
            travelMinutes: 0,
            location: '',
            ticket: 'none',
            reference: '',
          }),
        );
        focusCalendar(parsed.date);
      } else {
        if (parsed.intent === 'task')
          await workspace.save({
            ...workspace.draft('task'),
            title: parsed.title,
            details: { ...emptyTaskDetails(), deadline: parsed.date },
          });
        else
          await workspace.save({
            ...workspace.draft('note'),
            title: parsed.title,
            body: parsed.title,
          });
        navigate(parsed.intent === 'task' ? 'tasks' : 'records');
      }
      history.unshift(input);
      history.splice(30);
      if (parsed.intent !== 'purchase') onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'The command could not be saved.',
      );
    }
  };
  return (
    <Modal title="Command terminal" onClose={onClose}>
      <div className={s.page}>
        {receipt ? (
          <>
            <ReceiptPrinter {...receipt} />
            <button type="button" onClick={onClose}>
              Return to financial core
            </button>
          </>
        ) : (
          <>
            <Field label="Command">
              <input
                autoFocus
                placeholder="buy keyboard $150 on 11/20"
                maxLength={2000}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setDate('');
                  setConfirmCore(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void confirm();
                  }
                  if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setInput(history[historyIndex] ?? input);
                    setHistoryIndex((i) => Math.min(i + 1, history.length - 1));
                  }
                }}
              />
            </Field>
            {parsed?.question ? (
              <>
                <p role="status">{parsed.question}</p>
                {/date|weekday/i.test(parsed.question) && (
                  <Field label="Confirm command date">
                    <input
                      type="date"
                      value={date || parsed.date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </Field>
                )}
                {/date|weekday/i.test(parsed.question) && (
                  <button
                    type="button"
                    onClick={() => setDate(date || parsed.date)}
                  >
                    Use this date
                  </button>
                )}
              </>
            ) : (
              parsed && (
                <p className={s.alert}>
                  {parsed.intent} · {parsed.title} · {parsed.date}{' '}
                  {parsed.intent === 'purchase'
                    ? money(parsed.cents)
                    : timeLabel(parsed.hour)}
                </p>
              )
            )}
            {protectedSlot && (
              <label>
                <input
                  type="checkbox"
                  checked={confirmCore}
                  onChange={(e) => setConfirmCore(e.target.checked)}
                />
                Allow this personal event inside protected working hours
              </label>
            )}
            {error && <p role="alert">{error}</p>}
            <DynamicButton
              disabled={
                !parsed ||
                !!parsed.question ||
                busy ||
                (!!protectedSlot && !confirmCore)
              }
              onClick={() => void confirm()}
            >
              Confirm command
            </DynamicButton>
            <p className={s.muted}>
              Preview first, Enter to confirm. Up recalls recent commands. Every
              change can be undone.
            </p>
          </>
        )}
      </div>
    </Modal>
  );
}
