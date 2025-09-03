import { Result } from './Result';
export class Guard {
    static combine(guardResults) {
        return Result.combine(guardResults);
    }
    static againstNullOrUndefined(argument, argumentName) {
        if (argument === null || argument === undefined) {
            return Result.fail(`${argumentName} is null or undefined`);
        }
        else {
            return Result.ok();
        }
    }
    static againstNullOrUndefinedBulk(args) {
        for (const arg of args) {
            const result = this.againstNullOrUndefined(arg.argument, arg.argumentName);
            if (result.isFailure)
                return result;
        }
        return Result.ok();
    }
    static isOneOf(value, validValues, argumentName) {
        let isValid = false;
        for (const validValue of validValues) {
            if (value === validValue) {
                isValid = true;
            }
        }
        if (isValid) {
            return Result.ok();
        }
        else {
            return Result.fail(`${argumentName} isn't oneOf the correct types in ${JSON.stringify(validValues)}. Got "${value}".`);
        }
    }
    static inRange(num, min, max, argumentName) {
        const isInRange = num >= min && num <= max;
        if (!isInRange) {
            return Result.fail(`${argumentName} is not within range ${min} to ${max}.`);
        }
        else {
            return Result.ok();
        }
    }
    static allInRange(numbers, min, max, argumentName) {
        let failingResult = null;
        for (const num of numbers) {
            const numIsInRangeResult = this.inRange(num, min, max, argumentName);
            if (numIsInRangeResult.isFailure)
                failingResult = numIsInRangeResult;
        }
        if (failingResult) {
            return Result.fail(`${argumentName} is not within the range.`);
        }
        else {
            return Result.ok();
        }
    }
    static againstEmptyString(value, argumentName) {
        if (value === '') {
            return Result.fail(`${argumentName} is empty`);
        }
        else {
            return Result.ok();
        }
    }
    static againstEmptyStringBulk(args) {
        for (const arg of args) {
            const result = this.againstEmptyString(arg.argument, arg.argumentName);
            if (result.isFailure)
                return result;
        }
        return Result.ok();
    }
    static againstAtLeast(num, min, argumentName) {
        const isAtLeast = num >= min;
        if (!isAtLeast) {
            return Result.fail(`${argumentName} must be at least ${min}.`);
        }
        else {
            return Result.ok();
        }
    }
}
//# sourceMappingURL=Guard.js.map