import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
interface PasswordProps {
    value: string;
}
export declare class Password extends ValueObject<PasswordProps> {
    private constructor();
    get value(): string;
    static createPlaintext(password: string): Result<Password>;
    static fromHash(hash: string): Result<Password>;
}
export {};
//# sourceMappingURL=Password.d.ts.map