import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
import { Guard } from '../../common/Guard';
export class ProblemSetDescription extends ValueObject {
    get value() {
        return this.props.value;
    }
    constructor(props) {
        super(props);
    }
    static create(description) {
        const guardResult = Guard.againstNullOrUndefined(description, 'description');
        if (guardResult.isFailure) {
            return Result.fail(guardResult.error);
        }
        const trimmedDescription = description.trim();
        if (trimmedDescription.length > 1000) {
            return Result.fail('Problem set description cannot exceed 1000 characters');
        }
        return Result.ok(new ProblemSetDescription({ value: trimmedDescription }));
    }
    static createEmpty() {
        return new ProblemSetDescription({ value: '' });
    }
}
//# sourceMappingURL=ProblemSetDescription.js.map