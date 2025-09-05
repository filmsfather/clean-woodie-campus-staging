import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
export class TokenReason extends ValueObject {
    get value() {
        return this.props.value;
    }
    static create(value) {
        if (!value || value.trim().length === 0) {
            return Result.fail('Token reason cannot be empty');
        }
        if (value.trim().length > 200) {
            return Result.fail('Token reason cannot exceed 200 characters');
        }
        return Result.ok(new TokenReason({ value: value.trim() }));
    }
}
//# sourceMappingURL=TokenReason.js.map