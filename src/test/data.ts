import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { webcrypto } from 'node:crypto';
import { NexusDatabase } from '../data/database';
import { WebCryptoVault } from '../data/vault';
import { RecordRepository } from '../data/repository';
import { CommandBus } from '../engine/commands';
import { FixedClock } from '../domain/clock';

Dexie.dependencies.indexedDB = indexedDB;
Dexie.dependencies.IDBKeyRange = IDBKeyRange;

let sequence = 0;
export const testCrypto = webcrypto as unknown as Crypto;
export function testName() {
  sequence += 1;
  return `nexus-test-${sequence}`;
}
export async function openData(name = testName()) {
  const db = new NexusDatabase(name);
  await db.open();
  const vault = new WebCryptoVault(db, testCrypto);
  await vault.initialize();
  const repository = new RecordRepository(db, vault);
  const clock = new FixedClock('2026-10-10T12:00:00Z');
  const bus = new CommandBus(repository, clock);
  return { db, vault, repository, bus, clock };
}
