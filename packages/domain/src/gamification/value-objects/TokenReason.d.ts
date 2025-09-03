import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
interface TokenReasonProps {
    value: string;
}
export declare class TokenReason extends ValueObject<TokenReasonProps> {
    get value(): string;
    static create(value: string): Result<TokenReason>;
}
export {};
//# sourceMappingURL=TokenReason.d.ts.map