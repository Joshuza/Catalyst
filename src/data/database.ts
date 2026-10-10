import Dexie, { type Table } from 'dexie';
import type { Row } from './stored';

export type KeyRow = { id: string; key: CryptoKey };
export type Metadata = { id: string; value: unknown };
export class NexusDatabase extends Dexie {
  records!: Table<Row, string>;
  keys!: Table<KeyRow, string>;
  metadata!: Table<Metadata, string>;
  constructor(name = 'nexus-os') {
    super(name);
    const stores = { records: '&id, kind', keys: '&id', metadata: '&id' };
    this.version(1).stores(stores);
    this.version(2)
      .stores(stores)
      .upgrade(async (transaction) => {
        const table = transaction.table<Row>('records');
        const previous = await table.toArray();
        // Store the full encrypted export before any forward transformation.
        await transaction.table<Metadata>('metadata').put({
          id: 'migration-1-to-2',
          value: {
            from: 1,
            to: 2,
            records: previous,
            keys: await transaction.table<KeyRow>('keys').toArray(),
          },
        });
        await table.bulkPut(
          previous.map((row) => {
            const value =
              row.value.storage === 'plain'
                ? {
                    ...row.value,
                    record: {
                      ...row.value.record,
                      sampleSet: row.value.record.sampleSet ?? null,
                    },
                  }
                : { ...row.value, sampleSet: row.value.sampleSet ?? null };
            return { ...row, value };
          }),
        );
      });
  }
}
