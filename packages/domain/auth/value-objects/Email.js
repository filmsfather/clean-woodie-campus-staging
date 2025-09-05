import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
import { Guard } from '../../common/Guard';
export class Email extends ValueObject {
    constructor(props) {
        super(props);
    }
    get value() {
        return this.props.value;
    }
    static create(email) {
        const guardResult = Guard.againstNullOrUndefined(email, 'email');
        if (guardResult.isFailure) {
            return Result.fail(guardResult.error);
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return Result.fail('Invalid email format');
        }
        if (email.length > 320) {
            return Result.fail('Email is too long');
        }
        return Result.ok(new Email({ value: email.toLowerCase().trim().normalize('NFC') }));
    }
}
//# sourceMappingURL=Email.js.map