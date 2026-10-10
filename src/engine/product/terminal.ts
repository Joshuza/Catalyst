import * as chrono from 'chrono-node';
import { parseMoney } from '../../domain/money';
import type { Profile } from '../../domain/product/model';
import { weekday } from '../../domain/product/dates';
export type ParsedCommand = {
  intent: 'purchase' | 'event' | 'task' | 'note';
  title: string;
  date: string;
  hour: number;
  cents: number;
  bought: boolean;
  confidence: number;
  question?: string;
};
export function parseCommand(
  input: string,
  today: string,
  profile: Profile,
  clarifiedDate?: string,
): ParsedCommand {
  const text = input.trim().slice(0, 2000);
  const intent =
    /^(?:buy|bought|want to buy|going to buy|i bought|i want to buy|paid|i paid|parking ticket|speeding ticket|fine)/i.test(
      text,
    )
      ? 'purchase'
      : /^(?:finish|task|complete|submit)/i.test(text)
        ? 'task'
        : /^note\b/i.test(text)
          ? 'note'
          : 'event';
  const base: ParsedCommand = {
    intent,
    title: text,
    date: today,
    hour: 9,
    cents: 0,
    bought: /^(?:i )?(?:bought|paid)\b/i.test(text),
    confidence: 0,
  };
  if (!text) return { ...base, question: 'What would you like to add?' };
  if (intent === 'note')
    return {
      ...base,
      title: text.replace(/^note\s*/i, '').trim(),
      confidence: 1,
    };
  const amount = /\$\s*([\d,]+(?:\.\d+)?k?)/i.exec(text);
  if (intent === 'purchase' && !amount)
    return { ...base, question: 'What is the purchase cost?' };
  if (amount) base.cents = parseMoney(amount[1] ?? '');
  if (intent === 'purchase' && base.cents <= 0)
    return { ...base, question: 'What positive purchase amount should I use?' };
  const reference = new Date(`${today}T12:00:00`);
  const results = chrono.en.parse(text, reference, { forwardDate: true });
  const first = results[0];
  if (!first && !clarifiedDate)
    return { ...base, question: 'On which date should this happen?' };
  if (
    /next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i.test(
      text,
    ) &&
    !clarifiedDate
  )
    return {
      ...base,
      date: first ? dateString(first.start.date()) : today,
      question:
        'Which date do you mean by next weekday? Choose the date to confirm.',
    };
  const date =
    clarifiedDate || (first ? dateString(first.start.date()) : today);
  if (date < today && !base.bought)
    return {
      ...base,
      date,
      question: 'This date is in the past. Which future date should I use?',
    };
  const shift = profile.shifts.filter((s) => s.day === weekday(date)).at(-1);
  const hour = /after work/i.test(text)
    ? shift?.end
    : first &&
        (first.start.isCertain('hour') ||
          /\b(noon|midnight)\b/i.test(first.text))
      ? (first.start.get('hour') ?? 9) + (first.start.get('minute') ?? 0) / 60
      : 9;
  if (/after work/i.test(text) && hour === undefined)
    return {
      ...base,
      date,
      question: 'There are no working hours that day. What time should I use?',
    };
  const title = text
    .replace(
      /^(?:i )?(?:want to buy|going to buy|buy|bought|paid|reminder|event|task|note)\s*/i,
      '',
    )
    .replace(amount?.[0] ?? '\u0000', '')
    .replace(first?.text ?? '\u0000', '')
    .replace(/\b(on|at|by|due|after work)\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  return {
    ...base,
    title: title || text,
    date,
    hour: hour ?? 9,
    confidence: 1,
  };
}
function dateString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
