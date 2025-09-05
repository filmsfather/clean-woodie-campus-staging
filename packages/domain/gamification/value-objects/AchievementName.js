import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
/**
 * 업적 이름 값 객체
 * 사용자에게 표시되는 업적의 이름
 */
export class AchievementName extends ValueObject {
    get value() {
        return this.props.value;
    }
    static create(value) {
        if (!value || value.trim().length === 0) {
            return Result.fail('Achievement name cannot be empty');
        }
        const trimmed = value.trim();
        if (trimmed.length > 100) {
            return Result.fail('Achievement name cannot exceed 100 characters');
        }
        if (trimmed.length < 2) {
            return Result.fail('Achievement name must be at least 2 characters');
        }
        return Result.ok(new AchievementName({ value: trimmed }));
    }
    equals(other) {
        return this.value === other.value;
    }
}
//# sourceMappingURL=AchievementName.js.map