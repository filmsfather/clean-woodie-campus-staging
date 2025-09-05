import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
import { Guard } from '../../common/Guard';
export class Password extends ValueObject {
    constructor(props) {
        super(props);
    }
    get value() {
        return this.props.value;
    }
    static createPlaintext(password) {
        const guardResult = Guard.againstNullOrUndefined(password, 'password');
        if (guardResult.isFailure) {
            return Result.fail(guardResult.error);
        }
        if (password.length < 8) {
            return Result.fail('Password must be at least 8 characters long');
        }
        if (password.length > 72) {
            return Result.fail('Password too long');
        }
        if (!/(?=.*[a-z])/.test(password)) {
            return Result.fail('Password must contain at least one lowercase letter');
        }
        if (!/(?=.*[A-Z])/.test(password)) {
            return Result.fail('Password must contain at least one uppercase letter');
        }
        if (!/(?=.*\d)/.test(password)) {
            return Result.fail('Password must contain at least one number');
        }
        return Result.ok(new Password({ value: password }));
    }
    static fromHash(hash) {
        const guardResult = Guard.againstNullOrUndefined(hash, 'hash');
        if (guardResult.isFailure) {
            return Result.fail(guardResult.error);
        }
        return Result.ok(new Password({ value: hash }));
    }
}
//# sourceMappingURL=Password.js.map