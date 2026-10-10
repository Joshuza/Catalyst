import { z } from 'zod';

export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return (
      Number.isFinite(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
    );
  }, 'Enter a valid calendar date.');
export const instantSchema = z.iso.datetime();
export const centsSchema = z.number().int().refine(Number.isSafeInteger);
export const baseShape = {
  id: z.string().regex(/^[0-7][0-9A-HJKMNP-TV-Z]{25}$/),
  createdAt: instantSchema,
  updatedAt: instantSchema,
  schemaVersion: z.literal(1),
  deletedAt: instantSchema.nullable(),
  sampleSet: z.string().max(100).nullable(),
};
const title = z.string().trim().min(1).max(300);
const text = z.string().max(20000);
export const recordSchema = z.discriminatedUnion('kind', [
  z
    .object({ ...baseShape, kind: z.literal('note'), title, body: text })
    .strict(),
  z
    .object({
      ...baseShape,
      kind: z.literal('task'),
      title,
      notes: text,
      completed: z.boolean(),
    })
    .strict(),
  z
    .object({
      ...baseShape,
      kind: z.literal('transaction'),
      title,
      amountCents: centsSchema,
      currency: z.string().regex(/^[A-Z]{3}$/),
      date: dateSchema,
      category: z.string().max(100),
      receiptFile: z.string().max(300).nullable(),
    })
    .strict(),
  z
    .object({
      ...baseShape,
      kind: z.literal('message'),
      title,
      body: text,
      sender: z.string().min(1).max(300),
      unread: z.boolean(),
      date: dateSchema,
      stream: z.enum(['work', 'personal', 'promotional']),
    })
    .strict(),
  z
    .object({
      ...baseShape,
      kind: z.literal('recipe'),
      title,
      ingredients: z.array(z.string().max(300)).max(200),
    })
    .strict(),
  z
    .object({
      ...baseShape,
      kind: z.literal('settings'),
      title,
      locale: z
        .string()
        .max(100)
        .refine((value) => {
          try {
            new Intl.NumberFormat(value);
            return true;
          } catch {
            return false;
          }
        }),
      currency: z.string().regex(/^[A-Z]{3}$/),
    })
    .strict(),
]);
export type UserRecord = z.infer<typeof recordSchema>;
export type RecordKind = UserRecord['kind'];
export type Note = Extract<UserRecord, { kind: 'note' }>;
export type Transaction = Extract<UserRecord, { kind: 'transaction' }>;
export type RecordChange = {
  id: string;
  before: UserRecord | null;
  after: UserRecord;
};
export interface RecordStore {
  apply(changes: RecordChange[]): Promise<UserRecord[]>;
}

export function recordText(record: UserRecord): string {
  switch (record.kind) {
    case 'note':
      return record.body;
    case 'task':
      return record.notes;
    case 'message':
      return `${record.sender} ${record.body}`;
    case 'transaction':
      return `${record.category} ${record.receiptFile ?? ''}`;
    case 'recipe':
      return record.ingredients.join(' ');
    case 'settings':
      return `${record.locale} ${record.currency}`;
  }
}
