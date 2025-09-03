import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
// 반 식별자 값 객체
export class ClassId extends ValueObject {
    get value() {
        return this.props.value;
    }
    constructor(props) {
        super(props);
    }
    static create(value) {
        if (!value || value.trim().length === 0) {
            return Result.fail('Class ID cannot be empty');
        }
        if (value.trim().length > 50) {
            return Result.fail('Class ID cannot exceed 50 characters');
        }
        // 기본적인 형식 검증 (영숫자, 하이픈, 언더스코어만 허용)
        const validFormat = /^[a-zA-Z0-9_-]+$/.test(value.trim());
        if (!validFormat) {
            return Result.fail('Class ID can only contain letters, numbers, hyphens, and underscores');
        }
        return Result.ok(new ClassId({ value: value.trim() }));
    }
    equals(other) {
        if (!other || !other.props) {
            return false;
        }
        return this.props.value === other.props.value;
    }
    toString() {
        return this.props.value;
    }
}
//# sourceMappingURL=ClassId.js.map