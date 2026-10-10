import { useState } from 'react';
import { Modal } from '../local/Modal';
import { workspace } from '../local/runtime';
import { addDays } from '../../domain/product/dates';
import { Field, MoneyField } from './Common';
import { useProduct, type Entity } from './state';
import { ReceiptPrinter } from './Animations';
import s from './product.module.css';
export function PurchaseSurvey({
  purchase,
  onDone,
}: {
  purchase: Entity<'purchase'>;
  onDone: () => void;
}) {
  const { today, busy } = useProduct();
  const [answer, setAnswer] = useState<'bought' | 'postponed' | 'canceled'>(
      'bought',
    ),
    [cost, setCost] = useState(purchase.data.costCents),
    [date, setDate] = useState(addDays(today, 1)),
    [regret, setRegret] = useState(3),
    [emotion, setEmotion] = useState<
      'Essential' | 'Joyful' | 'Impulsive' | 'Regretted'
    >('Essential'),
    [error, setError] = useState(''),
    [printing, setPrinting] = useState(false),
    [complete, setComplete] = useState(false);
  if (complete) return null;
  const save = async () => {
    try {
      if (answer === 'bought' && cost <= 0)
        throw new Error('Enter the final positive cost.');
      if (answer === 'postponed' && date <= today)
        throw new Error('Choose a future purchase date.');
      const after = {
        ...purchase,
        data: {
          ...purchase.data,
          status: answer === 'postponed' ? ('planned' as const) : answer,
          date:
            answer === 'postponed'
              ? date
              : answer === 'bought'
                ? today
                : purchase.data.date,
          actualCents: answer === 'bought' ? cost : null,
          regret: answer === 'bought' ? regret : null,
          emotion: answer === 'bought' ? emotion : null,
        },
      };
      if (answer === 'bought') {
        const transaction = {
          ...workspace.draft('transaction'),
          title: purchase.title,
          amountCents: -cost,
          currency: purchase.data.currency ?? workspace.profile.currency,
          date: today,
          category: 'Purchase',
          receiptFile: null,
          regret,
          emotion,
        };
        after.data.transactionId = transaction.id;
        await workspace.commit('Purchase reconciled', [after, transaction]);
        setPrinting(true);
        setTimeout(() => {
          setComplete(true);
          onDone();
        }, 2300);
      } else {
        await workspace.save(after);
        setComplete(true);
        onDone();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Your answers could not be saved.',
      );
    }
  };
  return (
    <Modal
      title={`Post-purchase survey: ${purchase.title}`}
      required
      onClose={() => undefined}
    >
      <div className={s.page}>
        {printing ? (
          <ReceiptPrinter title={purchase.title} cents={cost} />
        ) : (
          <form
            className={s.form}
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
          >
            <p className={s.muted}>
              This scheduled purchase needs an answer before you continue.
              Postponing requires a new date.
            </p>
            <Field label="Did you purchase the scheduled item?">
              <select
                value={answer}
                onChange={(e) => setAnswer(e.target.value as typeof answer)}
              >
                <option value="bought">Bought</option>
                <option value="postponed">Postponed</option>
                <option value="canceled">Canceled</option>
              </select>
            </Field>
            {answer === 'bought' && (
              <>
                <MoneyField
                  label="Final exact cost including tax and shipping"
                  cents={cost}
                  onChange={setCost}
                />
                <Field label="Regret rating">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={regret}
                    onChange={(e) => setRegret(Number(e.target.value))}
                  />
                  <span>{regret} of 5</span>
                </Field>
                <Field label="Emotional tag">
                  <select
                    value={emotion}
                    onChange={(e) =>
                      setEmotion(e.target.value as typeof emotion)
                    }
                  >
                    {['Essential', 'Joyful', 'Impulsive', 'Regretted'].map(
                      (tag) => (
                        <option key={tag}>{tag}</option>
                      ),
                    )}
                  </select>
                </Field>
              </>
            )}
            {answer === 'postponed' && (
              <Field label="New purchase date">
                <input
                  type="date"
                  min={addDays(today, 1)}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </Field>
            )}
            {answer === 'canceled' && (
              <p>
                The cart dip will be removed. Your savings will be recorded on
                the plan.
              </p>
            )}
            {error && <p role="alert">{error}</p>}
            <button type="submit" disabled={busy} className={s.primary}>
              Save survey
            </button>
          </form>
        )}
      </div>
    </Modal>
  );
}
