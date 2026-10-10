import { workspace } from '../local/runtime';
import type { Profile } from '../../domain/product/model';
import { Field, MoneyField } from './Common';
import s from './product.module.css';
import { useProduct } from './state';
const cadences = [
  ['weekly', 'Weekly'],
  ['biweekly', 'Bi-Weekly'],
  ['semimonthly', 'Semi-Monthly'],
  ['monthly', 'Monthly'],
  ['irregular', 'Irregular Freelance'],
] as const;
export function ProfileFinance({
  draft,
  patch,
  show,
}: {
  draft: Profile;
  patch: (p: Partial<Profile>) => void;
  show: (i: number) => boolean;
}) {
  const state = useProduct();
  return (
    <>
      {show(0) && (
        <fieldset>
          <legend>How often are you paid?</legend>
          <div className={s.chips}>
            {cadences.map(([value, label]) => (
              <label key={value}>
                <input
                  type="radio"
                  name="cadence"
                  checked={draft.pay.cadence === value}
                  onChange={() =>
                    patch({ pay: { ...draft.pay, cadence: value } })
                  }
                />
                {label}
              </label>
            ))}
          </div>
          {draft.pay.cadence === 'semimonthly' && (
            <div className={s.pair}>
              {draft.semiDays.map((day, i) => (
                <Field key={i} label={`Pay day ${i + 1}`}>
                  <input
                    type="number"
                    min="1"
                    max="28"
                    value={day}
                    onChange={(e) => {
                      const semiDays: [number, number] = [...draft.semiDays];
                      semiDays[i] = Number(e.target.value);
                      patch({ semiDays });
                    }}
                  />
                </Field>
              ))}
            </div>
          )}
        </fieldset>
      )}
      {show(1) && (
        <>
          <MoneyField
            currency={draft.currency}
            label="Net income per pay period after taxes"
            cents={draft.pay.amountCents}
            onChange={(amountCents) =>
              patch({ pay: { ...draft.pay, amountCents } })
            }
          />
          <Field label="Currency">
            <select
              value={draft.currency}
              onChange={(e) => patch({ currency: e.target.value })}
            >
              {['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'INR'].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          {draft.pay.amountCents > 5000000 && (
            <p className={s.muted}>
              That is a large pay amount. Check for an extra zero before
              continuing.
            </p>
          )}
        </>
      )}
      {show(2) && (
        <Field label="Next deposit date">
          <input
            type="date"
            value={draft.pay.nextDate}
            onChange={(e) =>
              patch({ pay: { ...draft.pay, nextDate: e.target.value } })
            }
          />
        </Field>
      )}
      {show(3) && (
        <>
          <MoneyField
            currency={draft.currency}
            label="Current liquid savings"
            cents={draft.savingsCents}
            onChange={(savingsCents) => patch({ savingsCents })}
          />
          <p className={s.muted}>Exclude retirement and illiquid assets.</p>
          <Field label="Balance anchor date">
            <input
              type="date"
              value={
                draft.balanceDate ??
                workspace.profile.balanceDate ??
                draft.pay.nextDate
              }
              onChange={(e) => patch({ balanceDate: e.target.value })}
            />
            <span className={s.muted}>
              Use the balance immediately before this date’s entries. Refreshing
              savings starts a new anchor; earlier cleared records are already
              included in it.
            </span>
          </Field>
          <label>
            <input
              type="checkbox"
              checked={draft.overdraft}
              onChange={(e) => patch({ overdraft: e.target.checked })}
            />
            Allow an overdraft balance
          </label>
        </>
      )}
      {show(3) && (
        <MoneyField
          currency={draft.currency}
          label="Safety buffer"
          cents={draft.safetyBufferCents ?? 0}
          onChange={(safetyBufferCents) => patch({ safetyBufferCents })}
        />
      )}
      {show(4) && (
        <>
          <h3>Secondary recurring income</h3>
          {draft.streams.map((stream, i) => (
            <div className={s.panel} key={i}>
              <Field label="Income source">
                <input
                  value={stream.name}
                  onChange={(e) =>
                    patch({
                      streams: draft.streams.map((v, j) =>
                        j === i ? { ...v, name: e.target.value } : v,
                      ),
                    })
                  }
                />
              </Field>
              <MoneyField
                currency={draft.currency}
                label="Secondary income amount"
                cents={stream.amountCents}
                onChange={(amountCents) =>
                  patch({
                    streams: draft.streams.map((v, j) =>
                      j === i ? { ...v, amountCents } : v,
                    ),
                  })
                }
              />
              <Field label="Secondary cadence">
                <select
                  value={stream.cadence}
                  onChange={(e) =>
                    patch({
                      streams: draft.streams.map((v, j) =>
                        j === i
                          ? {
                              ...v,
                              cadence: e.target.value as typeof stream.cadence,
                            }
                          : v,
                      ),
                    })
                  }
                >
                  {['weekly', 'biweekly', 'monthly', 'quarterly'].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label="Next secondary deposit">
                <input
                  type="date"
                  value={stream.nextDate}
                  onChange={(e) =>
                    patch({
                      streams: draft.streams.map((v, j) =>
                        j === i ? { ...v, nextDate: e.target.value } : v,
                      ),
                    })
                  }
                />
              </Field>
              <button
                type="button"
                onClick={() =>
                  patch({ streams: draft.streams.filter((_, j) => j !== i) })
                }
              >
                Remove income
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              patch({
                streams: [
                  ...draft.streams,
                  {
                    name: '',
                    amountCents: 0,
                    cadence: 'monthly',
                    nextDate: state.today,
                  },
                ],
              })
            }
          >
            Add income
          </button>
        </>
      )}
      {show(5) && (
        <>
          {draft.pay.cadence === 'irregular' ? (
            <>
              <MoneyField
                currency={draft.currency}
                label="Typical invoice size"
                cents={draft.invoiceCents}
                onChange={(invoiceCents) => patch({ invoiceCents })}
              />
              <Field label="Typical payment delay in days">
                <input
                  type="number"
                  min="0"
                  max="180"
                  value={draft.delayDays}
                  onChange={(e) => patch({ delayDays: Number(e.target.value) })}
                />
              </Field>
              <MoneyField
                currency={draft.currency}
                label="Conservative low-month estimate"
                cents={draft.lowMonthCents}
                onChange={(lowMonthCents) => patch({ lowMonthCents })}
              />
            </>
          ) : (
            <p>No freelance estimates are needed for a regular pay schedule.</p>
          )}
        </>
      )}
    </>
  );
}
