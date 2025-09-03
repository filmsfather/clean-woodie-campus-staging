import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
interface AchievementNameProps {
    value: string;
}
/**
 * 업적 이름 값 객체
 * 사용자에게 표시되는 업적의 이름
 */
export declare class AchievementName extends ValueObject<AchievementNameProps> {
    get value(): string;
    static create(value: string): Result<AchievementName>;
    equals(other: AchievementName): boolean;
}
export {};
//# sourceMappingURL=AchievementName.d.ts.map