import { IClock } from '@woodie/domain/srs'

export class SystemClock implements IClock {
  now(): Date {
    return new Date()
  }
}

export class TestClock implements IClock {
  constructor(private fixedDate: Date) {}

  now(): Date {
    return new Date(this.fixedDate)
  }

  setDate(date: Date): void {
    this.fixedDate = new Date(date)
  }

  advance(milliseconds: number): void {
    this.fixedDate = new Date(this.fixedDate.getTime() + milliseconds)
  }

  advanceDays(days: number): void {
    this.advance(days * 24 * 60 * 60 * 1000)
  }

  advanceHours(hours: number): void {
    this.advance(hours * 60 * 60 * 1000)
  }

  advanceMinutes(minutes: number): void {
    this.advance(minutes * 60 * 1000)
  }
}