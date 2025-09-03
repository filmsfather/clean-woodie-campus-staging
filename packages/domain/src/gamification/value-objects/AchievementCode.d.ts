import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
interface AchievementCodeProps {
    value: string;
}
/**
 * 업적 코드 값 객체
 * 업적을 고유하게 식별하는 코드 (예: EARN_TOKENS_100, COMPLETE_QUIZ_10)
 */
export declare class AchievementCode extends ValueObject<AchievementCodeProps> {
    get value(): string;
    static create(value: string): Result<AchievementCode>;
    equals(other: AchievementCode): boolean;
}
export {};
//# sourceMappingURL=AchievementCode.d.ts.map