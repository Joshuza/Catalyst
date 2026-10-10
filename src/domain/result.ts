export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export class NotImplementedError extends Error {
  constructor(feature: string) {
    super(`${feature} is not implemented.`);
    this.name = 'NotImplementedError';
  }
}
