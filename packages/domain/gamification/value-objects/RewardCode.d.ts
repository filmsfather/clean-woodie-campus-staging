import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
interface RewardCodeProps {
    value: string;
}
/**
 * 보상 코드 값 객체
 * 보상을 고유하게 식별하는 코드 (예: BADGE_PREMIUM, FEATURE_UNLIMITED_HINTS)
 */
export declare class RewardCode extends ValueObject<RewardCodeProps> {
    get value(): string;
    static create(value: string): Result<RewardCode>;
    equals(other: RewardCode): boolean;
}
export {};
//# sourceMappingURL=RewardCode.d.ts.map