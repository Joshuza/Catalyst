import { describe, expect, it } from 'vitest';
import { FixedClock, SystemClock, type Clock } from './clock';
import { createUlidGenerator } from './id';
import { NotImplementedError, type Result } from './result';

describe('deterministic foundation utilities', () => {
  it('returns defensive copies of a fixed UTC instant', () => {
    const clock = new FixedClock('2026-10-09T12:00:00Z');
    clock.now().setFullYear(2000);
    expect(clock.now().toISOString()).toBe('2026-10-09T12:00:00.000Z');
  });
  it('rejects invalid clock input', () => {
    expect(() => new FixedClock('not a date')).toThrow(RangeError);
  });
  it('provides a system Date without a browser dependency', () => {
    expect(new SystemClock().now()).toBeInstanceOf(Date);
  });
  it('makes 1,000 unique, sortable ULIDs within one millisecond', () => {
    const id = createUlidGenerator(
      new FixedClock('2026-10-09T12:00:00Z'),
      (n) => new Uint8Array(n),
    );
    const ids = Array.from({ length: 1000 }, id);
    expect(new Set(ids).size).toBe(1000);
    expect([...ids].sort()).toEqual(ids);
    for (const value of ids)
      expect(value).toMatch(/^[0-7][0-9A-HJKMNP-TV-Z]{25}$/);
  });
  it('keeps IDs monotonic if the clock moves backwards', () => {
    let instant = 100;
    const clock: Clock = { now: () => new Date(instant) };
    const id = createUlidGenerator(clock, (n) => new Uint8Array(n));
    const first = id();
    instant = 50;
    expect(id() > first).toBe(true);
  });
  it('rejects out-of-range timestamps and incorrect entropy lengths', () => {
    const past: Clock = { now: () => new Date(-1) };
    expect(() => createUlidGenerator(past, (n) => new Uint8Array(n))()).toThrow(
      RangeError,
    );
    expect(() =>
      createUlidGenerator(new SystemClock(), () => new Uint8Array(9))(),
    ).toThrow(RangeError);
  });
  it('refuses to wrap exhausted entropy into duplicate identifiers', () => {
    const id = createUlidGenerator(
      new FixedClock('2026-10-09T12:00:00Z'),
      (n) => new Uint8Array(n).fill(255),
    );
    id();
    expect(id).toThrow('ULID entropy exhausted');
  });
  it('provides explicit failure results and named missing-feature errors', () => {
    const failure: Result<string, Error> = {
      ok: false,
      error: new NotImplementedError('Finance module'),
    };
    expect(failure.ok).toBe(false);
    expect(failure.error.name).toBe('NotImplementedError');
  });
});
