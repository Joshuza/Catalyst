import { parseMoney } from '../money';
import { z } from 'zod';
import { date, cents } from './model';
export const receiptResultSchema = z
  .object({
    vendor: z.string().max(300),
    date,
    totalCents: cents.refine((v) => v >= 0),
    taxCents: cents.refine((v) => v >= 0),
    items: z.array(z.string().max(300)).max(300),
    confidence: z.number().min(0).max(1),
  })
  .strict()
  .refine(
    (v) => v.taxCents <= v.totalCents,
    'Tax cannot exceed the receipt total.',
  );
export type ReceiptResult = z.infer<typeof receiptResultSchema>;
export const AUTO_RECEIPT_CONFIDENCE = 0.9;
export function parseReceiptText(
  input: string,
  fallbackDate: string,
): ReceiptResult {
  const lines = input
    .slice(0, 100000)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const vendor =
    lines
      .find(
        (l) =>
          l.length > 2 &&
          !/receipt|invoice|total|tax|date|\d{4}-\d{2}/i.test(l),
      )
      ?.slice(0, 300) ?? '';
  const totalLine = [...lines]
    .reverse()
    .find((l) =>
      /^(?:grand\s+total|total\s*(?:paid|due|amount)?|amount\s+paid)\b/i.test(
        l,
      ),
    );
  const taxLine = lines.find((l) => /^(?:sales\s+)?tax\b/i.test(l));
  const amount = (l: string | undefined) => {
    const matches = l?.match(/-?\$?\s*\d[\d,]*(?:\.\d{2})/g);
    try {
      return matches?.length
        ? Math.abs(parseMoney(matches.at(-1)!.replace('$', '').trim()))
        : null;
    } catch {
      return null;
    }
  };
  const total = amount(totalLine),
    tax = amount(taxLine);
  const iso = /\b(\d{4}-\d{2}-\d{2})\b/.exec(input)?.[1];
  const us = /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/.exec(input);
  const candidate =
    iso ??
    (us
      ? `${us[3]}-${us[1]!.padStart(2, '0')}-${us[2]!.padStart(2, '0')}`
      : null);
  const valid =
    candidate && date.safeParse(candidate).success ? candidate : null;
  const confidence =
    (vendor ? 0.25 : 0) +
    (valid ? 0.25 : 0) +
    (total !== null ? 0.35 : 0) +
    (tax !== null ? 0.15 : 0);
  return receiptResultSchema.parse({
    vendor,
    date: valid ?? fallbackDate,
    totalCents: total ?? 0,
    taxCents: tax ?? 0,
    items: lines
      .filter(
        (l) =>
          l !== vendor &&
          l !== totalLine &&
          l !== taxLine &&
          !l.includes(valid ?? '\u0000'),
      )
      .slice(0, 300)
      .map((l) => l.slice(0, 300)),
    confidence: Math.round(confidence * 100) / 100,
  });
}
export function csvCell(value: unknown): string {
  let text = String(value ?? '');
  if (/^[\s]*[=+\-@\t\r]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}
export function reportCsv(rows: unknown[][]): string {
  return rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
}
