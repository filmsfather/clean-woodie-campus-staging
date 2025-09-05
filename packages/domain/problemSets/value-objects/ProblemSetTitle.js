import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
import { Guard } from '../../common/Guard';
export class ProblemSetTitle extends ValueObject {
    get value() {
        return this.props.value;
    }
    constructor(props) {
        super(props);
    }
    static create(title) {
        const guardResult = Guard.againstNullOrUndefined(title, 'title');
        if (guardResult.isFailure) {
            return Result.fail(guardResult.error);
        }
        const trimmedTitle = title.trim();
        if (trimmedTitle.length === 0) {
            return Result.fail('Problem set title cannot be empty');
        }
        if (trimmedTitle.length > 200) {
            return Result.fail('Problem set title cannot exceed 200 characters');
        }
        return Result.ok(new ProblemSetTitle({ value: trimmedTitle }));
    }
}
//# sourceMappingURL=ProblemSetTitle.js.map