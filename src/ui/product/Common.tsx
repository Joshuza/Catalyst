import {
  useState,
  Children,
  isValidElement,
  cloneElement,
  type ReactNode,
} from 'react';
import { parseMoney, formatMoney } from '../../domain/money';
import { workspace } from '../local/runtime';
import { HoldToConfirmButton } from '../local/HoldToConfirmButton';
import type { UserRecord } from '../../domain/records';
import { run } from './state';
import s from './product.module.css';
export function Page({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section
      className={s.page}
      onClickCapture={(e) => {
        const button = (e.target as HTMLElement).closest('button');
        const form = button?.closest(`form,.${s.form}`);
        if (!form || /^(Back|Skip|Cancel)/.test(button?.textContent ?? ''))
          return;
        const invalid = form.querySelector<HTMLInputElement>(
          'input:invalid,select:invalid,textarea:invalid',
        );
        if (invalid) {
          e.preventDefault();
          e.stopPropagation();
          invalid.reportValidity();
        }
      }}
    >
      <div className={s.titleRow}>
        <div>
          <p className={s.eyebrow}>CATALYST / YOUR DAY, CONNECTED</p>
          <h1>{title}</h1>
          <p className={s.subtitle}>{subtitle}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
export function Panel({
  title,
  children,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <section className={`${s.panel} ${wide ? s.wide : ''}`}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className={s.field}>
      {label}
      {Children.map(children, (child) =>
        isValidElement<Record<string, unknown>>(child) &&
        typeof child.type === 'string' &&
        ['input', 'select', 'textarea'].includes(child.type)
          ? cloneElement(child, {
              'aria-label': child.props['aria-label'] ?? label,
            })
          : child,
      )}
    </label>
  );
}
export function MoneyField({
  label,
  cents,
  onChange,
  allowZero = true,
  currency = workspace.profile.currency,
}: {
  label: string;
  cents: number;
  onChange: (cents: number) => void;
  allowZero?: boolean;
  currency?: string;
}) {
  const [value, setValue] = useState(String(cents / 100)),
    [error, setError] = useState('');
  return (
    <Field label={label}>
      <input
        inputMode="decimal"
        aria-invalid={!!error}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          try {
            const parsed = parseMoney(e.target.value, workspace.locale);
            if (!allowZero && parsed <= 0)
              throw new Error('Enter an amount greater than zero.');
            onChange(parsed);
            setError('');
            e.target.setCustomValidity('');
          } catch (err) {
            const message =
              err instanceof Error ? err.message : 'Check this amount.';
            setError(message);
            e.target.setCustomValidity(message);
          }
        }}
        onBlur={() => {
          if (!error)
            setValue(
              new Intl.NumberFormat(workspace.locale, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(cents / 100),
            );
        }}
      />
      <span className={s.muted}>
        {error || formatMoney(cents, workspace.locale, currency)}
      </span>
    </Field>
  );
}
export function DeleteRecord({ record }: { record: UserRecord }) {
  return <HoldToConfirmButton onConfirm={() => workspace.remove(record)} />;
}
export function SaveButton({
  busy = false,
  label = 'Save',
  onClick,
}: {
  busy?: boolean;
  label?: string;
  onClick: () => Promise<unknown>;
}) {
  return (
    <button
      type="button"
      className={s.primary}
      disabled={busy}
      onClick={() => run(onClick())}
    >
      {label}
    </button>
  );
}
export function ToggleSet({
  label,
  options,
  values,
  onChange,
  labels = {},
  icons = {},
}: {
  label: string;
  labels?: Record<string, string>;
  icons?: Record<string, ReactNode>;
  options: string[];
  values: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <fieldset style={{ border: 0, padding: 0 }}>
      <legend>{label}</legend>
      <div className={s.chips}>
        {options.map((option, i) => (
          <button
            type="button"
            key={option}
            aria-pressed={values.includes(option)}
            onClick={() =>
              onChange(
                values.includes(option)
                  ? values.filter((v) => v !== option)
                  : [...values, option],
              )
            }
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
                const buttons =
                  e.currentTarget.parentElement?.querySelectorAll('button');
                buttons?.[
                  (i + (e.key === 'ArrowRight' ? 1 : -1) + options.length) %
                    options.length
                ]?.focus();
              }
            }}
          >
            {icons[option] && <span aria-hidden="true">{icons[option]}</span>}{' '}
            {labels[option] ?? option}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
