import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
interface AchievementDescriptionProps {
    value: string;
}
/**
 * 업적 설명 값 객체
 * 업적 달성 조건이나 설명
 */
export declare class AchievementDescription extends ValueObject<AchievementDescriptionProps> {
    get value(): string;
    static create(value: string): Result<AchievementDescription>;
    equals(other: AchievementDescription): boolean;
    isEmpty(): boolean;
}
export {};
//# sourceMappingURL=AchievementDescription.d.ts.map