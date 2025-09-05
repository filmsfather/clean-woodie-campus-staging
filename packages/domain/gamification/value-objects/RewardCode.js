import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
/**
 * 보상 코드 값 객체
 * 보상을 고유하게 식별하는 코드 (예: BADGE_PREMIUM, FEATURE_UNLIMITED_HINTS)
 */
export class RewardCode extends ValueObject {
    get value() {
        return this.props.value;
    }
    static create(value) {
        if (!value || value.trim().length === 0) {
            return Result.fail('Reward code cannot be empty');
        }
        const trimmed = value.trim().toUpperCase();
        if (trimmed.length > 50) {
            return Result.fail('Reward code cannot exceed 50 characters');
        }
        // 보상 코드 형식: 영문자, 숫자, 언더스코어만 허용
        const validFormat = /^[A-Z0-9_]+$/.test(trimmed);
        if (!validFormat) {
            return Result.fail('Reward code can only contain uppercase letters, numbers, and underscores');
        }
        return Result.ok(new RewardCode({ value: trimmed }));
    }
    equals(other) {
        return this.value === other.value;
    }
}
//# sourceMappingURL=RewardCode.js.map