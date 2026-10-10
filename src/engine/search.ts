import MiniSearch from 'minisearch';
import { parseMoney } from '../domain/money';
import {
  recordText,
  type RecordKind,
  type UserRecord,
} from '../domain/records';

export const months = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
];
export type SearchFilters = {
  text: string;
  receipt: boolean;
  unread: boolean;
  sender?: string;
  month?: number;
  year?: string;
  amount?: {
    cents: number;
    comparison: 'over' | 'under' | 'at least' | 'at most';
  };
};
export function parseSearch(input: string): SearchFilters {
  let text = input.slice(0, 500).trim().toLowerCase();
  const receipt = /\breceipts?\b/.test(text);
  if (receipt) text = text.replace(/\breceipts?\b/g, '');
  const unread = /\bunread\b/.test(text);
  text = text.replace(/\bunread\b/g, '');
  const amountMatch =
    /\b(over|under|at least|at most)\s*\$?([0-9,]+(?:\.[0-9]+)?k?)\b/.exec(
      text,
    );
  const amount = amountMatch
    ? {
        cents: parseMoney(amountMatch[2] ?? ''),
        comparison: amountMatch[1] as 'over' | 'under' | 'at least' | 'at most',
      }
    : undefined;
  if (amountMatch) text = text.replace(amountMatch[0], '');
  const monthMatch = new RegExp(
    `\\b(?:in\\s+)?(${months.join('|')})(?:\\s+(\\d{4}))?\\b`,
  ).exec(text);
  const month = monthMatch
    ? months.indexOf(monthMatch[1] ?? '') + 1
    : undefined;
  const year = monthMatch?.[2];
  if (monthMatch) text = text.replace(monthMatch[0], '');
  const senderMatch = /\bfrom\s+(.+)$/.exec(text);
  const sender = senderMatch?.[1]?.trim();
  if (senderMatch) text = text.replace(senderMatch[0], '');
  return { text: text.trim(), receipt, unread, sender, month, year, amount };
}
function matches(record: UserRecord, filters: SearchFilters): boolean {
  if (record.deletedAt || record.kind === 'settings') return false;
  if (
    filters.receipt &&
    (record.kind !== 'transaction' ||
      !(record.receiptFile || /receipt|invoice/i.test(record.title)))
  )
    return false;
  if (filters.unread && (record.kind !== 'message' || !record.unread))
    return false;
  if (
    filters.sender &&
    (record.kind !== 'message' ||
      !record.sender.toLowerCase().includes(filters.sender))
  )
    return false;
  if (filters.month !== undefined) {
    if (
      !('date' in record) ||
      Number(record.date.slice(5, 7)) !== filters.month ||
      (filters.year && record.date.slice(0, 4) !== filters.year)
    )
      return false;
  }
  if (filters.amount) {
    if (record.kind !== 'transaction') return false;
    const cost = Math.abs(record.amountCents);
    const { cents, comparison } = filters.amount;
    if (
      (comparison === 'over' && cost <= cents) ||
      (comparison === 'under' && cost >= cents) ||
      (comparison === 'at least' && cost < cents) ||
      (comparison === 'at most' && cost > cents)
    )
      return false;
  }
  return true;
}
export type SearchHit = { record: UserRecord; score: number };
const tokenize = (text: string) =>
  text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
export class LocalSearch {
  private index = new MiniSearch<{ id: string; title: string; text: string }>({
    fields: ['title', 'text'],
    tokenize,
    searchOptions: { boost: { title: 3 }, prefix: true, combineWith: 'AND' },
  });
  private records = new Map<string, UserRecord>();
  private terms = new Map<string, Set<string>>();
  private frequency = new Map<string, number>();
  rebuild(records: UserRecord[]) {
    this.index.removeAll();
    this.records.clear();
    this.terms.clear();
    this.frequency.clear();
    const documents = [];
    for (const record of records) {
      if (record.deletedAt || record.kind === 'settings') continue;
      this.records.set(record.id, record);
      const terms = new Set(tokenize(`${record.title} ${recordText(record)}`));
      this.terms.set(record.id, terms);
      for (const term of terms)
        this.frequency.set(term, (this.frequency.get(term) ?? 0) + 1);
      documents.push({
        id: record.id,
        title: record.title,
        text: recordText(record),
      });
    }
    this.index.addAll(documents);
  }
  search(input: string, limit = 40): SearchHit[] {
    const filters = parseSearch(input);
    const terms = tokenize(filters.text);
    const anchor = [...terms].sort(
      (a, b) =>
        (this.frequency.get(a) ?? 0) - (this.frequency.get(b) ?? 0) ||
        b.length - a.length,
    )[0];
    const ranked = anchor
      ? this.index
          .search(anchor)
          .map((hit) => ({ id: String(hit.id), score: hit.score }))
      : Array.from(this.records.keys(), (id) => ({ id, score: 1 }));
    const hits: SearchHit[] = [];
    for (const hit of ranked) {
      const record = this.records.get(hit.id);
      const recordTerms = this.terms.get(hit.id);
      const includesTerms = terms.every((term) =>
        Array.from(recordTerms ?? []).some((word) => word.startsWith(term)),
      );
      if (record && includesTerms && matches(record, filters))
        hits.push({
          record,
          score:
            record.kind === 'message' && record.stream === 'promotional'
              ? hit.score * 0.05
              : hit.score,
        });
    }
    return hits
      .sort(
        (a, b) =>
          b.score - a.score ||
          b.record.updatedAt.localeCompare(a.record.updatedAt) ||
          a.record.id.localeCompare(b.record.id),
      )
      .slice(0, limit);
  }
  groups(hits: SearchHit[]): Partial<Record<RecordKind, SearchHit[]>> {
    const groups: Partial<Record<RecordKind, SearchHit[]>> = {};
    for (const hit of hits) (groups[hit.record.kind] ??= []).push(hit);
    return groups;
  }
}
export type QuickAction = {
  label: string;
  kind: 'note' | 'task' | 'export';
  month?: number;
};
export function quickActions(input: string): QuickAction[] {
  const query = input.trim().toLowerCase();
  const actions: QuickAction[] = [
    { label: 'New note', kind: 'note' },
    { label: 'New task', kind: 'task' },
  ];
  const month = months.findIndex((name) => query === `export ${name}`);
  if (month >= 0)
    return [
      { label: `Export ${months[month]}`, kind: 'export', month: month + 1 },
    ];
  return actions.filter((action) =>
    action.label.toLowerCase().startsWith(query),
  );
}
