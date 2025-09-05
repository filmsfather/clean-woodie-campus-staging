import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
export declare enum LeaderboardTypeEnum {
    TOKEN_BALANCE = "token_balance",
    TOKEN_EARNED = "token_earned",
    ACHIEVEMENTS = "achievements",
    WEEKLY_TOKENS = "weekly_tokens",
    MONTHLY_TOKENS = "monthly_tokens"
}
interface LeaderboardTypeProps {
    value: LeaderboardTypeEnum;
}
/**
 * 리더보드 타입 값 객체
 * 어떤 기준으로 순위를 매기는지 정의합니다
 */
export declare class LeaderboardType extends ValueObject<LeaderboardTypeProps> {
    get value(): LeaderboardTypeEnum;
    static create(value: LeaderboardTypeEnum): Result<LeaderboardType>;
    static tokenBalance(): Result<LeaderboardType>;
    static tokenEarned(): Result<LeaderboardType>;
    static achievements(): Result<LeaderboardType>;
    static weeklyTokens(): Result<LeaderboardType>;
    static monthlyTokens(): Result<LeaderboardType>;
    getDisplayName(): string;
    equals(other: LeaderboardType): boolean;
}
export {};
//# sourceMappingURL=LeaderboardType.d.ts.map