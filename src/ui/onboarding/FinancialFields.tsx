import type { Profile } from '../../domain/product/profile';
import { Field, MoneyField, ToggleSet } from '../product/Common';
import { addMonths } from '../../domain/product/dates';
import { useProduct } from '../product/state';
import p from '../product/product.module.css';
const categories = [
  'Rent/Mortgage',
  'Utilities',
  'Car Payment',
  'Insurance',
  'Loans',
];
export type SurveyFieldsProps = {
  draft: Profile;
  patch: (value: Partial<Profile>) => void;
};
export function FinancialFields({
  draft,
  patch,
  question,
}: SurveyFieldsProps & { question: string }) {
  const { today } = useProduct();
  if (question === 'buffer')
    return (
      <MoneyField
        label="Minimum safe balance"
        cents={draft.safetyBufferCents ?? 0}
        currency={draft.currency}
        onChange={(safetyBufferCents) => patch({ safetyBufferCents })}
      />
    );
  const expenses = draft.fixedExpenses ?? [];
  return (
    <>
      <ToggleSet
        label="Fixed monthly overhead"
        options={categories}
        values={expenses.map((e) => e.name)}
        onChange={(names) =>
          patch({
            fixedExpenses: names.map(
              (name) =>
                expenses.find((e) => e.name === name) ?? {
                  name,
                  amountCents: 0,
                  nextDate: today,
                },
            ),
          })
        }
      />
      {expenses.map((expense, index) => (
        <div className={p.pair} key={expense.name}>
          <MoneyField
            label={`${expense.name} monthly estimate`}
            cents={expense.amountCents}
            currency={draft.currency}
            onChange={(amountCents) =>
              patch({
                fixedExpenses: expenses.map((e, i) =>
                  i === index ? { ...e, amountCents } : e,
                ),
              })
            }
          />
          <Field label={`${expense.name} next due date`}>
            <input
              type="date"
              min={today}
              max={addMonths(today, 12)}
              value={expense.nextDate}
              onChange={(e) =>
                patch({
                  fixedExpenses: expenses.map((v, i) =>
                    i === index ? { ...v, nextDate: e.target.value } : v,
                  ),
                })
              }
            />
          </Field>
        </div>
      ))}
      <p className={p.muted}>
        These are plans, not cleared transactions. Your actual balance changes
        only when spending is recorded.
      </p>
    </>
  );
}
