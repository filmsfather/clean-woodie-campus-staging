import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
/**
 * 보상 이름 값 객체
 * 사용자에게 표시되는 보상의 이름
 */
export class RewardName extends ValueObject {
    get value() {
        return this.props.value;
    }
    static create(value) {
        if (!value || value.trim().length === 0) {
            return Result.fail('Reward name cannot be empty');
        }
        const trimmed = value.trim();
        if (trimmed.length > 100) {
            return Result.fail('Reward name cannot exceed 100 characters');
        }
        if (trimmed.length < 2) {
            return Result.fail('Reward name must be at least 2 characters');
        }
        return Result.ok(new RewardName({ value: trimmed }));
    }
    equals(other) {
        return this.value === other.value;
    }
}
//# sourceMappingURL=RewardName.js.map