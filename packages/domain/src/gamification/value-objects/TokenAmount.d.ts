import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
interface TokenAmountProps {
    value: number;
}
export declare class TokenAmount extends ValueObject<TokenAmountProps> {
    get value(): number;
    static create(value: number): Result<TokenAmount>;
    add(other: TokenAmount): Result<TokenAmount>;
    subtract(other: TokenAmount): Result<TokenAmount>;
    isGreaterThan(other: TokenAmount): boolean;
    isGreaterThanOrEqual(other: TokenAmount): boolean;
    equals(other: TokenAmount): boolean;
}
export {};
//# sourceMappingURL=TokenAmount.d.ts.map