import { useState } from 'react';
import { recordSchema } from '../../domain/records';
import { nextCharge } from '../../domain/product/billing';
import { workspace } from '../local/runtime';
import { Field, MoneyField } from './Common';
import { ReceiptPrinter } from './Animations';
import { useProduct, type Entity } from './state';
import s from './product.module.css';
export function SubscriptionPayment({
  item,
}: {
  item: Entity<'subscription'>;
}) {
  const { today, busy, profile } = useProduct();
  const [date, setDate] = useState(today),
    [cost, setCost] = useState(item.data.amountCents),
    [error, setError] = useState(''),
    [printed, setPrinted] = useState(false);
  async function recordCharge() {
    try {
      if (date > today || date < item.data.nextDate)
        throw new Error(
          'Enter a cleared charge date on or after the scheduled bill, no later than today.',
        );
      if (
        (item.data.paidCharges ?? []).some(
          (c) => c.scheduledDate === item.data.nextDate,
        )
      )
        throw new Error('This bill has already been logged.');
      const draft = workspace.draft('transaction');
      const id = draft.id;
      const transaction = recordSchema.parse({
        ...draft,
        kind: 'transaction',
        title: item.title,
        amountCents: -cost,
        currency: item.data.currency ?? profile.currency,
        date,
        category: 'Subscription',
        receiptFile: null,
      });
      await workspace.commit('Subscription charge logged', [
        transaction,
        {
          ...item,
          data: {
            ...item.data,
            billingAnchor: item.data.billingAnchor ?? item.data.nextDate,
            nextDate: nextCharge(item.data),
            trialEnd: null,
            paidCharges: [
              ...(item.data.paidCharges ?? []),
              {
                date,
                scheduledDate: item.data.nextDate,
                totalCents: cost,
                transactionId: id,
              },
            ],
          },
        },
      ]);
      setPrinted(true);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Charge could not be saved.');
    }
  }
  return (
    <details>
      <summary>Log cleared charge</summary>
      <div className={s.form}>
        <p>This records a bill you already paid. It does not make a payment.</p>
        <Field label={`Cleared date for ${item.title}`}>
          <input
            type="date"
            min={item.data.nextDate}
            max={today}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>
        <MoneyField
          label={`Final charge for ${item.title}`}
          cents={cost}
          currency={item.data.currency ?? profile.currency}
          onChange={setCost}
        />
        <button
          type="button"
          disabled={busy || date > today || date < item.data.nextDate}
          onClick={() => void recordCharge()}
        >
          Record cleared charge
        </button>
        {error && <p role="alert">{error}</p>}
        {!!item.data.paidCharges?.length && (
          <p>
            {item.data.paidCharges.length} logged bills. Included in expense
            exports.
          </p>
        )}
        {printed && (
          <ReceiptPrinter
            title={item.title}
            cents={cost}
            currency={item.data.currency ?? profile.currency}
          />
        )}
      </div>
    </details>
  );
}
