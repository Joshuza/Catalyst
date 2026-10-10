import {
  recordSchema,
  type RecordChange,
  type RecordStore,
  type UserRecord,
} from '../domain/records';
import type { NexusDatabase } from './database';
import {
  authentication,
  rowSchema,
  type Row,
  type StoredRecord,
} from './stored';
import type { Vault } from './vault';

export type ReadIssue = { id: string; message: string };
export class RecordRepository implements RecordStore {
  constructor(
    readonly db: NexusDatabase,
    private vault: Vault,
  ) {}
  private async encode(input: UserRecord): Promise<Row> {
    const record = recordSchema.parse(input);
    if (
      !['transaction', 'message', 'module', 'settings'].includes(record.kind)
    ) {
      return rowSchema.parse({
        id: record.id,
        kind: record.kind,
        value: { storage: 'plain', record },
      });
    }
    const {
      id,
      kind,
      createdAt,
      updatedAt,
      schemaVersion,
      deletedAt,
      sampleSet,
      ...payload
    } = record;
    const metadata = {
      id,
      kind,
      createdAt,
      updatedAt,
      schemaVersion,
      deletedAt,
      sampleSet,
    };
    const fields: Extract<StoredRecord, { storage: 'encrypted' }>['fields'] =
      {};
    for (const [field, value] of Object.entries(payload)) {
      fields[field] = await this.vault.encrypt(
        value,
        authentication(metadata, field),
      );
    }
    return rowSchema.parse({
      id,
      kind,
      value: { ...metadata, storage: 'encrypted', fields },
    });
  }
  private async decode(input: unknown): Promise<UserRecord> {
    const row = rowSchema.parse(input);
    if (row.value.storage === 'plain')
      return recordSchema.parse(row.value.record);
    const { fields, ...envelope } = row.value;
    const metadata = { ...envelope };
    Reflect.deleteProperty(metadata, 'storage');
    const payload: Record<string, unknown> = {};
    for (const [field, value] of Object.entries(fields)) {
      payload[field] = await this.vault.decrypt(
        value,
        authentication(metadata, field),
      );
    }
    return recordSchema.parse({ ...metadata, ...payload });
  }
  async readAll(): Promise<{ records: UserRecord[]; issues: ReadIssue[] }> {
    const records: UserRecord[] = [];
    const issues: ReadIssue[] = [];
    for (const row of await this.db.records.toArray()) {
      try {
        records.push(await this.decode(row));
      } catch {
        issues.push({
          id: row.id,
          message:
            'A stored record could not be verified. It was kept unchanged. Restore a backup to recover it.',
        });
      }
    }
    return { records, issues };
  }
  async get(id: string) {
    const row = await this.db.records.get(id);
    return row ? this.decode(row) : null;
  }
  async apply(changes: RecordChange[]): Promise<UserRecord[]> {
    if (new Set(changes.map((change) => change.id)).size !== changes.length)
      throw new Error('A command contains duplicate records.');
    const prepared: { previous: Row | undefined; next: Row }[] = [];
    for (const change of changes) {
      if (
        change.id !== change.after.id ||
        (change.before && change.id !== change.before.id)
      )
        throw new Error('Record identity does not match.');
      const previous = await this.db.records.get(change.id);
      const state = previous ? await this.decode(previous) : null;
      if (
        JSON.stringify(state) !==
        JSON.stringify(change.before ? recordSchema.parse(change.before) : null)
      )
        throw new Error(
          'This record changed in another window. Reopen it before saving.',
        );
      if (
        state &&
        (state.kind !== change.after.kind ||
          state.createdAt !== change.after.createdAt)
      )
        throw new Error('A record cannot change its identity or type.');
      prepared.push({ previous, next: await this.encode(change.after) });
    }
    await this.db.transaction('rw', this.db.records, this.db.keys, async () => {
      if (
        prepared.some((item) => item.next.value.storage === 'encrypted') &&
        !(await this.db.keys.get('device'))
      )
        throw new Error('The vault key is missing. Nothing was saved.');
      for (const item of prepared) {
        const current = await this.db.records.get(item.next.id);
        if (JSON.stringify(current) !== JSON.stringify(item.previous))
          throw new Error(
            'Records changed in another window. Nothing was saved.',
          );
      }
      await this.db.records.bulkPut(prepared.map((item) => item.next));
    });
    return changes.map((change) => recordSchema.parse(change.after));
  }
}
