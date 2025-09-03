import { IClock } from '@domain/srs';
export declare class SystemClock implements IClock {
    now(): Date;
}
export declare class TestClock implements IClock {
    private fixedDate;
    constructor(fixedDate: Date);
    now(): Date;
    setDate(date: Date): void;
    advance(milliseconds: number): void;
    advanceDays(days: number): void;
    advanceHours(hours: number): void;
    advanceMinutes(minutes: number): void;
}
//# sourceMappingURL=SystemClock.d.ts.map