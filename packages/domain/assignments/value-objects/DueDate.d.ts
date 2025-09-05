import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
interface DueDateProps {
    value: Date;
    timezone?: string;
}
export declare class DueDate extends ValueObject<DueDateProps> {
    private static readonly DEFAULT_TIMEZONE;
    private static readonly MIN_ADVANCE_HOURS;
    private static readonly MAX_ADVANCE_DAYS;
    get value(): Date;
    get timezone(): string;
    private constructor();
    static create(dueDate: Date, timezone?: string): Result<DueDate>;
    static createFromNow(hoursFromNow: number, timezone?: string): Result<DueDate>;
    isOverdue(): boolean;
    isDueSoon(hoursThreshold?: number): boolean;
    getTimeUntilDue(): number;
    getHoursUntilDue(): number;
    getDaysUntilDue(): number;
    extend(additionalHours: number): Result<DueDate>;
    changeTo(newDueDate: Date): Result<DueDate>;
    toLocalString(): string;
    getStatusMessage(): string;
    equals(other: DueDate): boolean;
    toString(): string;
    private static isValidTimezone;
    static createEndOfDay(date: Date, timezone?: string): Result<DueDate>;
    static createEndOfWeek(timezone?: string): Result<DueDate>;
    static createNextWeek(timezone?: string): Result<DueDate>;
}
export {};
//# sourceMappingURL=DueDate.d.ts.map