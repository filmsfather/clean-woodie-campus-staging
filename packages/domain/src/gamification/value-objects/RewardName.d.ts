import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
interface RewardNameProps {
    value: string;
}
/**
 * 보상 이름 값 객체
 * 사용자에게 표시되는 보상의 이름
 */
export declare class RewardName extends ValueObject<RewardNameProps> {
    get value(): string;
    static create(value: string): Result<RewardName>;
    equals(other: RewardName): boolean;
}
export {};
//# sourceMappingURL=RewardName.d.ts.map