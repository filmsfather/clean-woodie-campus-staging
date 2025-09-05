import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
import { Guard } from '../../common/Guard';
export class ReviewFeedback extends ValueObject {
    static AGAIN = 'AGAIN';
    static HARD = 'HARD';
    static GOOD = 'GOOD';
    static EASY = 'EASY';
    get value() {
        return this.props.value;
    }
    constructor(props) {
        super(props);
    }
    static create(value) {
        const nullOrUndefinedGuard = Guard.againstNullOrUndefined(value, 'value');
        if (nullOrUndefinedGuard.isFailure) {
            return Result.fail(nullOrUndefinedGuard.error);
        }
        const validValues = ['AGAIN', 'HARD', 'GOOD', 'EASY'];
        const validValueGuard = Guard.isOneOf(value, validValues, 'value');
        if (validValueGuard.isFailure) {
            return Result.fail(validValueGuard.error);
        }
        return Result.ok(new ReviewFeedback({ value }));
    }
    static again() {
        return new ReviewFeedback({ value: this.AGAIN });
    }
    static hard() {
        return new ReviewFeedback({ value: this.HARD });
    }
    static good() {
        return new ReviewFeedback({ value: this.GOOD });
    }
    static easy() {
        return new ReviewFeedback({ value: this.EASY });
    }
    isAgain() {
        return this.value === ReviewFeedback.AGAIN;
    }
    isHard() {
        return this.value === ReviewFeedback.HARD;
    }
    isGood() {
        return this.value === ReviewFeedback.GOOD;
    }
    isEasy() {
        return this.value === ReviewFeedback.EASY;
    }
}
//# sourceMappingURL=ReviewFeedback.js.map