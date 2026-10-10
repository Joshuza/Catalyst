import { z } from 'zod';
import { cipherSchema, type Cipher } from './stored';
import type { NexusDatabase } from './database';

export class VaultError extends Error {
  constructor(
    message = 'This encrypted record could not be read. Restore a backup or check this device’s vault key.',
  ) {
    super(message);
    this.name = 'VaultError';
  }
}
export interface Vault {
  initialize(): Promise<void>;
  encrypt(value: unknown, context: string): Promise<Cipher>;
  decrypt(value: Cipher, context: string): Promise<unknown>;
}
const keySchema = z.custom<CryptoKey>((value) => {
  if (typeof value !== 'object' || value === null || !('algorithm' in value))
    return false;
  const key = value as CryptoKey;
  return (
    key.type === 'secret' &&
    key.extractable === false &&
    key.algorithm.name === 'AES-GCM' &&
    key.usages.includes('encrypt') &&
    key.usages.includes('decrypt')
  );
});
function encode(value: ArrayBuffer | Uint8Array) {
  return btoa(
    Array.from(new Uint8Array(value))
      .map((byte) => String.fromCharCode(byte))
      .join(''),
  );
}
function decode(value: string) {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}

export class WebCryptoVault implements Vault {
  constructor(
    private db: NexusDatabase,
    private webCrypto: Crypto = globalThis.crypto,
  ) {}
  private async key() {
    const row = await this.db.keys.get('device');
    if (!row)
      throw new VaultError(
        'The vault key is missing. Your encrypted records were kept unchanged. Restore a portable backup.',
      );
    const parsed = keySchema.safeParse(row.key);
    if (!parsed.success)
      throw new VaultError(
        'The vault key is invalid. Your encrypted records were kept unchanged.',
      );
    return parsed.data;
  }
  async initialize() {
    if (await this.db.keys.get('device')) {
      await this.key();
      return;
    }
    const key = await this.webCrypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt'],
    );
    await this.db.transaction('rw', this.db.keys, this.db.records, async () => {
      if (await this.db.keys.get('device')) return;
      if (
        (await this.db.records.toArray()).some(
          (row) => row.value.storage === 'encrypted',
        )
      ) {
        throw new VaultError(
          'The vault key is missing. Your encrypted records were kept unchanged. Restore a portable backup.',
        );
      }
      await this.db.keys.put({ id: 'device', key });
    });
  }
  async encrypt(value: unknown, context: string): Promise<Cipher> {
    const iv = this.webCrypto.getRandomValues(new Uint8Array(12));
    const data = await this.webCrypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
        additionalData: new TextEncoder().encode(context),
      },
      await this.key(),
      new TextEncoder().encode(JSON.stringify(value)),
    );
    return { iv: encode(iv), data: encode(data) };
  }
  async decrypt(value: Cipher, context: string): Promise<unknown> {
    const parsed = cipherSchema.parse(value);
    const key = await this.key();
    try {
      const plain = await this.webCrypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: decode(parsed.iv),
          additionalData: new TextEncoder().encode(context),
        },
        key,
        decode(parsed.data),
      );
      return JSON.parse(new TextDecoder().decode(plain)) as unknown;
    } catch {
      throw new VaultError();
    }
  }
}
