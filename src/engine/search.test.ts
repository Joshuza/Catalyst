import { describe, expect, it, vi } from 'vitest';
import { LocalSearch, parseSearch, quickActions } from './search';
import { sampleRecords } from '../fixtures/search';
import { FixedClock } from '../domain/clock';
import { createUlidGenerator } from '../domain/id';
import type { UserRecord } from '../domain/records';

describe('SRCH-02 to SRCH-06: deterministic local search', () => {
  it('uses the required receipt and unread-sender sentences verbatim', () => {
    const search = new LocalSearch();
    search.rebuild(sampleRecords());
    expect(search.search('receipt')[0]?.record.title).toBe(
      'Sample: equipment invoice',
    );
    expect(
      search
        .search('receipts over $100 in October')
        .map((hit) => hit.record.title),
    ).toEqual(['Sample: equipment invoice']);
    expect(
      search.search('unread from Maria').map((hit) => hit.record.title),
    ).toEqual(['Sample: draft feedback']);
    expect(search.search('receipts at most $50 in October')).toHaveLength(1);
    expect(search.search('receipts under $50 in October')).toHaveLength(0);
    expect(search.search('receipts over $100 in October 2025')).toHaveLength(0);
    expect(parseSearch('unread from Maria in October').sender).toBe('maria');
  });
  it('searches all five kinds, excludes tombstones, groups results and offers actual quick actions', () => {
    const search = new LocalSearch();
    const records = sampleRecords();
    search.rebuild(records);
    expect(Object.keys(search.groups(search.search('')))).toEqual(
      expect.arrayContaining([
        'note',
        'task',
        'transaction',
        'message',
        'recipe',
      ]),
    );
    const note = records[0];
    if (!note) throw new Error('Missing note.');
    search.rebuild([{ ...note, deletedAt: '2026-10-10T00:00:00Z' }]);
    expect(search.search('research')).toEqual([]);
    expect(quickActions('new task')).toEqual([
      { label: 'New task', kind: 'task' },
    ]);
    expect(quickActions('export October')).toEqual([
      { label: 'Export october', kind: 'export', month: 10 },
    ]);
  });
  it('never touches IndexedDB or localStorage during index rebuilds and queries', () => {
    const disk = vi.spyOn(Storage.prototype, 'setItem');
    const database = vi.spyOn(indexedDB, 'open');
    const search = new LocalSearch();
    search.rebuild(sampleRecords());
    search.search('receipt');
    expect(localStorage.length).toBe(0);
    expect(disk).not.toHaveBeenCalled();
    expect(database).not.toHaveBeenCalled();
  });
  it('benchmarks receipt, month/amount and sender search over 50,000 deterministic records under 50 ms', () => {
    const clock = new FixedClock('2026-10-09T12:00:00Z');
    const id = createUlidGenerator(clock, (length) => new Uint8Array(length));
    const fixtures = sampleRecords();
    const records: UserRecord[] = [];
    for (let index = 0; index < 50000; index++) {
      const fixture = fixtures[index % fixtures.length];
      if (!fixture) throw new Error('Missing fixture.');
      records.push({
        ...fixture,
        id: id(),
        title: `${index % 500 === 0 ? fixture.title : 'Sample: indexed item'} ${index}`,
        ...(fixture.kind === 'transaction'
          ? { receiptFile: index % 500 === 0 ? fixture.receiptFile : null }
          : {}),
        ...(fixture.kind === 'message'
          ? { sender: index % 500 === 0 ? fixture.sender : 'Sample sender' }
          : {}),
      });
    }
    const search = new LocalSearch();
    search.rebuild(records);
    for (const query of [
      'receipt',
      'receipts over $100 in October',
      'unread from Maria',
      'indexed item 49999',
    ]) {
      search.search(query);
      const started = performance.now();
      const hits = search.search(query);
      const elapsed = performance.now() - started;
      console.info(
        `SEARCH_BENCHMARK records=50000 query=${JSON.stringify(query)} elapsed_ms=${elapsed.toFixed(2)} results=${hits.length}`,
      );
      expect(elapsed).toBeLessThan(50);
    }
  }, 15000);
});
