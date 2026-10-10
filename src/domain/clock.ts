export interface Clock {
  now(): Date;
}

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}

export class FixedClock implements Clock {
  private readonly instant: number;

  constructor(instant: string) {
    this.instant = Date.parse(instant);
    if (!Number.isFinite(this.instant))
      throw new RangeError('Invalid clock instant.');
  }

  now(): Date {
    return new Date(this.instant);
  }
}
