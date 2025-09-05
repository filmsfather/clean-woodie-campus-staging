import { Result } from './Result';
export interface GuardArgument {
    argument: any;
    argumentName: string;
}
export type GuardArgumentCollection = GuardArgument[];
export declare class Guard {
    static combine(guardResults: Result<any>[]): Result<any>;
    static againstNullOrUndefined(argument: any, argumentName: string): Result<any>;
    static againstNullOrUndefinedBulk(args: GuardArgumentCollection): Result<any>;
    static isOneOf(value: any, validValues: any[], argumentName: string): Result<any>;
    static inRange(num: number, min: number, max: number, argumentName: string): Result<any>;
    static allInRange(numbers: number[], min: number, max: number, argumentName: string): Result<any>;
    static againstEmptyString(value: string, argumentName: string): Result<any>;
    static againstEmptyStringBulk(args: GuardArgument[]): Result<any>;
    static againstAtLeast(num: number, min: number, argumentName: string): Result<any>;
}
//# sourceMappingURL=Guard.d.ts.map