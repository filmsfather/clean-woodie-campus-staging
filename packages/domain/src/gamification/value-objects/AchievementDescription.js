import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
/**
 * 업적 설명 값 객체
 * 업적 달성 조건이나 설명
 */
export class AchievementDescription extends ValueObject {
    get value() {
        return this.props.value;
    }
    static create(value) {
        const trimmed = value?.trim() || '';
        if (trimmed.length > 500) {
            return Result.fail('Achievement description cannot exceed 500 characters');
        }
        return Result.ok(new AchievementDescription({ value: trimmed }));
    }
    equals(other) {
        return this.value === other.value;
    }
    isEmpty() {
        return this.value.length === 0;
    }
}
//# sourceMappingURL=AchievementDescription.js.map