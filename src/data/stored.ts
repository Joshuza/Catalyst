import { z } from 'zod';
import { baseShape, recordSchema } from '../domain/records';

export const cipherSchema = z
  .object({
    iv: z
      .string()
      .regex(/^[A-Za-z0-9+/]+={0,2}$/)
      .max(32),
    data: z
      .string()
      .regex(/^[A-Za-z0-9+/]+={0,2}$/)
      .max(200000),
  })
  .strict();
export type Cipher = z.infer<typeof cipherSchema>;
export const encryptedSchema = z
  .object({
    ...baseShape,
    kind: z.enum(['transaction', 'message']),
    storage: z.literal('encrypted'),
    fields: z.record(z.string(), cipherSchema),
  })
  .strict()
  .refine((record) => {
    const expected =
      record.kind === 'transaction'
        ? [
            'title',
            'amountCents',
            'currency',
            'date',
            'category',
            'receiptFile',
          ]
        : ['title', 'body', 'sender', 'unread', 'date', 'stream'];
    const keys = Object.keys(record.fields);
    return (
      keys.length === expected.length &&
      keys.every((key) => expected.includes(key))
    );
  }, 'Encrypted fields do not match the record type.');
export const plainSchema = z
  .object({ storage: z.literal('plain'), record: recordSchema })
  .strict();
export const storedSchema = z.union([encryptedSchema, plainSchema]);
export type StoredRecord = z.infer<typeof storedSchema>;
export type Row = { id: string; kind: string; value: StoredRecord };
export const rowSchema = z
  .object({ id: baseShape.id, kind: z.string(), value: storedSchema })
  .strict()
  .refine((row) => {
    const record = row.value.storage === 'plain' ? row.value.record : row.value;
    return (
      row.id === record.id &&
      row.kind === record.kind &&
      (row.value.storage !== 'plain' ||
        !['message', 'transaction'].includes(row.kind))
    );
  }, 'Stored record identity or encryption does not match.');

export function authentication(
  record: {
    id: string;
    kind: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    sampleSet: string | null;
    schemaVersion: number;
  },
  field: string,
) {
  return JSON.stringify([
    record.id,
    record.kind,
    record.schemaVersion,
    record.createdAt,
    record.updatedAt,
    record.deletedAt,
    record.sampleSet,
    field,
  ]);
}
