import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
export class TokenAmount extends ValueObject {
    get value() {
        return this.props.value;
    }
    static create(value) {
        if (value < 0) {
            return Result.fail('Token amount cannot be negative');
        }
        if (!Number.isInteger(value)) {
            return Result.fail('Token amount must be an integer');
        }
        if (value > 1000000) {
            return Result.fail('Token amount cannot exceed 1,000,000');
        }
        return Result.ok(new TokenAmount({ value }));
    }
    add(other) {
        const newValue = this.value + other.value;
        return TokenAmount.create(newValue);
    }
    subtract(other) {
        const newValue = this.value - other.value;
        return TokenAmount.create(newValue);
    }
    isGreaterThan(other) {
        return this.value > other.value;
    }
    isGreaterThanOrEqual(other) {
        return this.value >= other.value;
    }
    equals(other) {
        return this.value === other.value;
    }
}
//# sourceMappingURL=TokenAmount.js.map