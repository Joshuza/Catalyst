function checked(value: bigint): number {
  const result = Number(value);
  if (!Number.isSafeInteger(result))
    throw new Error('Amount exceeds the supported range.');
  return result;
}
function integer(value: number): bigint {
  if (!Number.isSafeInteger(value))
    throw new Error('Money must be integer cents.');
  return BigInt(value);
}
export const addMoney = (a: number, b: number) =>
  checked(integer(a) + integer(b));
export const subtractMoney = (a: number, b: number) =>
  checked(integer(a) - integer(b));

export function parseMoney(input: string, locale = 'en-US'): number {
  const parts = new Intl.NumberFormat(locale).formatToParts(1234.5);
  const group = parts.find((part) => part.type === 'group')?.value ?? ',';
  const decimal = parts.find((part) => part.type === 'decimal')?.value ?? '.';
  const digits = new Intl.NumberFormat(locale, { useGrouping: false });
  let value = input
    .trim()
    .replace(/[$€£\u200e\u200f\u061c]/g, '')
    .trim();
  for (let digit = 0; digit < 10; digit++)
    value = value.split(digits.format(digit)).join(String(digit));
  // Reject malformed grouping instead of quietly changing the amount.
  const grouped =
    value.replace(/^[+-]/, '').replace(/k$/i, '').split(decimal)[0] ?? '';
  if (
    grouped.includes(group) &&
    !new RegExp(`^\\d{1,3}(?:${escapeRegExp(group)}\\d{3})+$`).test(grouped)
  ) {
    throw new Error('Check the amount separators.');
  }
  value = value.split(group).join('').replace(decimal, '.');
  const match = /^([+-]?)(\d+)(?:\.(\d+))?(k)?$/i.exec(value);
  if (!match) throw new Error('Enter an amount such as 150.25 or 4.5k.');
  const fraction = match[3] ?? '';
  const scale = match[4] ? 5 : 2;
  if (fraction.length > scale)
    throw new Error('The amount must resolve to exact cents.');
  const cents =
    BigInt(match[2] ?? '0') * 10n ** BigInt(scale) +
    BigInt(fraction.padEnd(scale, '0') || '0');
  return checked(match[1] === '-' ? -cents : cents);
}
function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Decimal division is restricted to display at the UI edge; arithmetic uses BigInt.
export function formatMoney(
  cents: number,
  locale = 'en-US',
  currency = 'USD',
): string {
  integer(cents);
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(
    cents / 100,
  );
}
