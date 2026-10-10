import { z } from 'zod';
import {
  moduleSchema,
  profileSchema,
  taskDetailSchema,
  recipeDetailSchema,
} from './product/model';

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
      details: taskDetailSchema.optional(),
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
      taxCents: centsSchema.optional(),
      regret: z.number().int().min(1).max(5).optional(),
      emotion: z.string().max(100).optional(),
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
      archived: z.boolean().optional(),
      taskId: z.string().max(100).optional(),
      replyNeeded: z.boolean().optional(),
    })
    .strict(),
  z
    .object({
      ...baseShape,
      kind: z.literal('recipe'),
      title,
      ingredients: z.array(z.string().max(300)).max(200),
      details: recipeDetailSchema.optional(),
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
      profile: profileSchema.optional(),
    })
    .strict(),
  z
    .object({
      ...baseShape,
      kind: z.literal('module'),
      title,
      data: moduleSchema,
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
      return `${record.notes} ${record.details?.rubric ?? ''} ${record.details?.resources.map((r) => `${r.title} ${r.url}`).join(' ') ?? ''}`;
    case 'message':
      return `${record.sender} ${record.body}`;
    case 'transaction':
      return `${record.category} ${record.receiptFile ?? ''}`;
    case 'recipe':
      return record.ingredients.join(' ');
    case 'settings':
      return `${record.locale} ${record.currency}`;
    case 'module':
      return record.data.type === 'receipt'
        ? `${record.data.vendor} ${record.data.filename}`
        : record.data.type === 'research'
          ? `${record.data.body} ${record.data.tags.join(' ')} ${record.data.url} ${record.data.pros} ${record.data.cons}`
          : record.data.type === 'audio'
            ? `${record.data.tags.join(' ')} ${record.data.context}`
            : record.data.type === 'health' || record.data.type === 'itinerary'
              ? record.data.notes
              : record.data.type;
  }
}
