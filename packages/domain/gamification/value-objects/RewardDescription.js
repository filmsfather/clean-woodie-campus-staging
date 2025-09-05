import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
/**
 * 보상 설명 값 객체
 * 보상에 대한 상세 설명
 */
export class RewardDescription extends ValueObject {
    get value() {
        return this.props.value;
    }
    static create(value) {
        const trimmed = value?.trim() || '';
        if (trimmed.length > 1000) {
            return Result.fail('Reward description cannot exceed 1000 characters');
        }
        return Result.ok(new RewardDescription({ value: trimmed }));
    }
    equals(other) {
        return this.value === other.value;
    }
    isEmpty() {
        return this.value.length === 0;
    }
}
//# sourceMappingURL=RewardDescription.js.map