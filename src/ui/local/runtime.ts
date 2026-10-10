import { SystemClock } from '../../domain/clock';
import { createUlidGenerator } from '../../domain/id';
import {
  recordSchema,
  type RecordKind,
  type UserRecord,
} from '../../domain/records';
import { NexusDatabase } from '../../data/database';
import { RecordRepository, type ReadIssue } from '../../data/repository';
import { WebCryptoVault } from '../../data/vault';
import { exportBackup, importBackup } from '../../data/backup';
import { CommandBus } from '../../engine/commands';
import { LocalSearch } from '../../engine/search';
import { sampleRecords, SAMPLE_SET } from '../../fixtures/search';

type Snapshot = {
  ready: boolean;
  busy: boolean;
  records: UserRecord[];
  issues: ReadIssue[];
  error: string | null;
  notice: string | null;
  canUndo: boolean;
  canRedo: boolean;
};
export class Workspace {
  private db = new NexusDatabase();
  private clock = new SystemClock();
  private id = createUlidGenerator(this.clock, (length) =>
    crypto.getRandomValues(new Uint8Array(length)),
  );
  private vault = new WebCryptoVault(this.db);
  private repository = new RecordRepository(this.db, this.vault);
  readonly bus = new CommandBus(this.repository, this.clock);
  readonly search = new LocalSearch();
  private listeners = new Set<() => void>();
  private initialization?: Promise<void>;
  private snapshot: Snapshot = {
    ready: false,
    busy: false,
    records: [],
    issues: [],
    error: null,
    notice: null,
    canUndo: false,
    canRedo: false,
  };
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  getSnapshot = () => this.snapshot;
  private update(values: Partial<Snapshot>) {
    this.snapshot = {
      ...this.snapshot,
      ...values,
      canUndo: this.bus.canUndo,
      canRedo: this.bus.canRedo,
    };
    for (const listener of this.listeners) listener();
  }
  initialize() {
    this.initialization ??= this.perform(null, async () => {
      await this.db.open();
      await this.vault.initialize();
      await this.refresh();
      this.update({ ready: true });
    });
    return this.initialization;
  }
  private async refresh() {
    const loaded = await this.repository.readAll();
    this.search.rebuild(loaded.records);
    this.update(loaded);
  }
  private async perform<T>(
    label: string | null,
    action: () => Promise<T>,
  ): Promise<T> {
    this.update({ busy: true, error: null });
    try {
      const result = await action();
      if (label) {
        await this.refresh();
        this.update({ notice: label });
      }
      return result;
    } catch (error) {
      this.update({
        error:
          error instanceof Error
            ? error.message
            : 'This action could not be completed. Nothing was saved.',
      });
      throw error;
    } finally {
      this.update({ busy: false });
    }
  }
  clearNotice() {
    this.update({ notice: null });
  }
  get locale() {
    const settings = this.snapshot.records.find(
      (record) => record.kind === 'settings' && !record.deletedAt,
    );
    return settings?.kind === 'settings' ? settings.locale : navigator.language;
  }
  draft(kind: 'note' | 'task' | 'transaction'): UserRecord {
    const base = {
      id: this.id(),
      kind,
      createdAt: this.clock.now().toISOString(),
      updatedAt: this.clock.now().toISOString(),
      schemaVersion: 1 as const,
      deletedAt: null,
      sampleSet: null,
      title: '',
    };
    if (kind === 'note') return { ...base, kind, body: '' };
    if (kind === 'task') return { ...base, kind, notes: '', completed: false };
    return {
      ...base,
      kind,
      amountCents: 0,
      currency: 'USD',
      date: this.clock.now().toISOString().slice(0, 10),
      category: '',
      receiptFile: null,
    };
  }
  save(input: UserRecord) {
    return this.perform('Record saved', async () => {
      const before =
        this.snapshot.records.find((record) => record.id === input.id) ?? null;
      if (before && before.updatedAt !== input.updatedAt)
        throw new Error('This record changed. Reopen it before saving.');
      const after = recordSchema.parse({
        ...input,
        updatedAt: this.clock.now().toISOString(),
      });
      await this.bus.execute('Save record', [{ id: after.id, before, after }]);
      return after;
    });
  }
  remove(record: UserRecord) {
    return this.perform('Record deleted', async () => {
      await this.bus.execute('Delete record', [
        {
          id: record.id,
          before: record,
          after: {
            ...record,
            deletedAt: this.clock.now().toISOString(),
            updatedAt: this.clock.now().toISOString(),
          },
        },
      ]);
    });
  }
  loadSamples() {
    return this.perform('Sample data loaded', async () => {
      const changes = [];
      for (const after of sampleRecords()) {
        const before = await this.repository.get(after.id);
        if (before && before.sampleSet !== SAMPLE_SET)
          throw new Error(
            'A sample identifier is already in use. Nothing was changed.',
          );
        if (!before || before.deletedAt)
          changes.push({ id: after.id, before, after });
      }
      await this.bus.execute('Load sample data', changes);
    });
  }
  removeSamples() {
    return this.perform('Sample data removed', async () => {
      const now = this.clock.now().toISOString();
      await this.bus.execute(
        'Remove sample data',
        this.snapshot.records
          .filter(
            (record) => record.sampleSet === SAMPLE_SET && !record.deletedAt,
          )
          .map((before) => ({
            id: before.id,
            before,
            after: { ...before, deletedAt: now, updatedAt: now },
          })),
      );
    });
  }
  history(direction: 'undo' | 'redo') {
    return this.perform(
      direction === 'undo' ? 'Change undone' : 'Change redone',
      () => this.bus[direction](),
    );
  }
  backup(month?: number) {
    return exportBackup(
      this.snapshot.records.filter(
        (record) =>
          month === undefined ||
          ('date' in record && Number(record.date.slice(5, 7)) === month),
      ),
      this.clock.now().toISOString(),
    );
  }
  restore(text: string) {
    return this.perform('Backup imported', async () => {
      const backup = importBackup(text);
      const changes = [];
      for (const after of backup.records) {
        const before = await this.repository.get(after.id);
        if (JSON.stringify(before) !== JSON.stringify(after))
          changes.push({ id: after.id, before, after });
      }
      await this.bus.execute('Import backup', changes);
    });
  }
  visible(kind?: RecordKind) {
    return this.snapshot.records.filter(
      (record) => !record.deletedAt && (!kind || record.kind === kind),
    );
  }
}
export const workspace = new Workspace();

export function downloadBackup(text: string, filename = 'nexus-backup.json') {
  const url = URL.createObjectURL(
    new Blob([text], { type: 'application/json' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
