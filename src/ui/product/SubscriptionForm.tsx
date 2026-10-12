import { useState } from 'react';
import { Field, MoneyField } from './Common';
import { useProduct, run } from './state';
import { workspace } from '../local/runtime';
import s from './product.module.css';
export function SubscriptionForm({ expanded = false }: { expanded?: boolean }) {
  const { today, busy } = useProduct();
  const [title, setTitle] = useState(''),
    [cents, setCents] = useState(0),
    [date, setDate] = useState(today),
    [trial, setTrial] = useState(''),
    [expiry, setExpiry] = useState(''),
    [url, setUrl] = useState(''),
    [cadence, setCadence] = useState<'monthly' | 'annual'>('monthly');
  return (
    <details open={expanded || undefined}>
      <summary>Add subscription or trial</summary>
      <div className={s.form}>
        <Field label="Subscription name">
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <MoneyField
          label="Subscription charge"
          cents={cents}
          onChange={setCents}
        />
        <Field label="Charge cadence">
          <select
            value={cadence}
            onChange={(e) => setCadence(e.target.value as typeof cadence)}
          >
            <option value="monthly">Monthly</option>
            <option value="annual">Annual</option>
          </select>
        </Field>
        <Field label="Next charge">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>
        <Field label="Trial end, if any">
          <input
            type="date"
            value={trial}
            onChange={(e) => setTrial(e.target.value)}
          />
        </Field>
        {trial && (
          <Field label="Exact trial expiry, if known">
            <input
              type="datetime-local"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
            />
            <span className={s.muted}>
              Without a time, alerts use the start of the trial end date in your
              local timezone.
            </span>
          </Field>
        )}
        <Field label="Billing URL">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </Field>
        <button
          type="button"
          disabled={!title.trim() || busy}
          onClick={() =>
            run(
              workspace
                .save(
                  workspace.make(title, {
                    type: 'subscription',
                    amountCents: cents,
                    cadence,
                    nextDate: date,
                    billingAnchor: date,
                    trialEnd: trial || null,
                    billingUrl: url,
                    ...(expiry
                      ? { trialEndAt: new Date(expiry).toISOString() }
                      : {}),
                  }),
                )
                .then(() => setTitle('')),
            )
          }
        >
          Save subscription
        </button>
      </div>
    </details>
  );
}
