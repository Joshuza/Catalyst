import type { Clock } from './clock';

const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const maxTime = 2 ** 48 - 1;
const maxEntropy = (1n << 80n) - 1n;
export type EntropySource = (length: number) => Uint8Array;

function encode(value: bigint, length: number): string {
  let output = '';
  for (let i = 0; i < length; i += 1) {
    output = alphabet.charAt(Number(value & 31n)) + output;
    value >>= 5n;
  }
  return output;
}

export function createUlidGenerator(clock: Clock, entropy: EntropySource) {
  let lastTime = -1;
  let lastEntropy = 0n;

  return (): string => {
    const current = clock.now().getTime();
    if (!Number.isSafeInteger(current) || current < 0 || current > maxTime) {
      throw new RangeError('Clock is outside the ULID timestamp range.');
    }
    const time = Math.max(current, lastTime);
    if (time === lastTime) {
      if (lastEntropy === maxEntropy)
        throw new RangeError('ULID entropy exhausted.');
      lastEntropy += 1n;
    } else {
      const bytes = entropy(10);
      if (bytes.length !== 10)
        throw new RangeError('ULID requires 10 entropy bytes.');
      lastEntropy = bytes.reduce(
        (value, byte) => (value << 8n) | BigInt(byte),
        0n,
      );
    }
    lastTime = time;
    return encode(BigInt(time), 10) + encode(lastEntropy, 16);
  };
}
