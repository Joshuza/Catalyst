import { z } from 'zod';
import {
  instantSchema,
  recordSchema,
  type UserRecord,
} from '../domain/records';

export const MAX_BACKUP_BYTES = 20 * 1024 * 1024;
export const backupSchema = z
  .object({
    format: z.literal('nexus-backup'),
    version: z.literal(1),
    exportedAt: instantSchema,
    records: z.array(recordSchema).max(50000),
  })
  .strict()
  .refine(
    (backup) =>
      new Set(backup.records.map((record) => record.id)).size ===
      backup.records.length,
    'A backup cannot contain duplicate record identifiers.',
  );
export type Backup = z.infer<typeof backupSchema>;
export function exportBackup(
  records: UserRecord[],
  exportedAt: string,
): string {
  const result = JSON.stringify(
    backupSchema.parse({
      format: 'nexus-backup',
      version: 1,
      exportedAt,
      records,
    }),
    null,
    2,
  );
  if (new TextEncoder().encode(result).length > MAX_BACKUP_BYTES)
    throw new Error('The backup exceeds the 20 MB limit.');
  return result;
}
export function importBackup(text: string): Backup {
  if (new TextEncoder().encode(text).length > MAX_BACKUP_BYTES)
    throw new Error('Choose a backup smaller than 20 MB.');
  try {
    return backupSchema.parse(JSON.parse(text) as unknown);
  } catch {
    throw new Error(
      'This file is not a valid Nexus backup. Nothing was imported.',
    );
  }
}
