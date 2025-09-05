import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
interface RewardDescriptionProps {
    value: string;
}
/**
 * 보상 설명 값 객체
 * 보상에 대한 상세 설명
 */
export declare class RewardDescription extends ValueObject<RewardDescriptionProps> {
    get value(): string;
    static create(value: string): Result<RewardDescription>;
    equals(other: RewardDescription): boolean;
    isEmpty(): boolean;
}
export {};
//# sourceMappingURL=RewardDescription.d.ts.map