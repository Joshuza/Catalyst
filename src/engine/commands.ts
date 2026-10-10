import type { Clock } from '../domain/clock';
import type { RecordChange, RecordStore, UserRecord } from '../domain/records';

type Entry = { label: string; patch: RecordChange[] };
export class CommandBus {
  private past: Entry[] = [];
  private future: Entry[] = [];
  private tail: Promise<unknown> = Promise.resolve();
  constructor(
    private store: RecordStore,
    private clock: Clock,
  ) {}
  get canUndo() {
    return this.past.length > 0;
  }
  get canRedo() {
    return this.future.length > 0;
  }
  private serial<T>(action: () => Promise<T>): Promise<T> {
    const next = this.tail.then(action);
    this.tail = next.catch(() => undefined);
    return next;
  }
  private async apply(
    entry: Entry,
  ): Promise<{ state: UserRecord[]; inverse: Entry }> {
    const state = await this.store.apply(entry.patch);
    const now = this.clock.now().toISOString();
    const patch = entry.patch.map((change) => ({
      id: change.id,
      before: change.after,
      after: change.before ?? {
        ...change.after,
        deletedAt: now,
        updatedAt: now,
      },
    }));
    return { state, inverse: { label: entry.label, patch } };
  }
  execute(label: string, changes: RecordChange[]) {
    return this.serial(async () => {
      if (!changes.length) return { state: [], inverse: [] };
      const result = await this.apply({ label, patch: changes });
      this.past.push(result.inverse);
      this.future = [];
      return { state: result.state, inverse: result.inverse.patch };
    });
  }
  undo() {
    return this.move(this.past, this.future);
  }
  redo() {
    return this.move(this.future, this.past);
  }
  private move(source: Entry[], target: Entry[]) {
    return this.serial(async () => {
      const entry = source.at(-1);
      if (!entry) return null;
      const result = await this.apply(entry);
      source.pop();
      target.push(result.inverse);
      return { label: entry.label, state: result.state };
    });
  }
}
