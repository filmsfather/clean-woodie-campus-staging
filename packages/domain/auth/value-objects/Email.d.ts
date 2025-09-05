import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
interface EmailProps {
    value: string;
}
export declare class Email extends ValueObject<EmailProps> {
    private constructor();
    get value(): string;
    static create(email: string): Result<Email>;
}
export {};
//# sourceMappingURL=Email.d.ts.map