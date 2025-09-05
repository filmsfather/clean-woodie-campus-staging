import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
export var LeaderboardTypeEnum;
(function (LeaderboardTypeEnum) {
    LeaderboardTypeEnum["TOKEN_BALANCE"] = "token_balance";
    LeaderboardTypeEnum["TOKEN_EARNED"] = "token_earned";
    LeaderboardTypeEnum["ACHIEVEMENTS"] = "achievements";
    LeaderboardTypeEnum["WEEKLY_TOKENS"] = "weekly_tokens";
    LeaderboardTypeEnum["MONTHLY_TOKENS"] = "monthly_tokens";
})(LeaderboardTypeEnum || (LeaderboardTypeEnum = {}));
/**
 * 리더보드 타입 값 객체
 * 어떤 기준으로 순위를 매기는지 정의합니다
 */
export class LeaderboardType extends ValueObject {
    get value() {
        return this.props.value;
    }
    static create(value) {
        if (!Object.values(LeaderboardTypeEnum).includes(value)) {
            return Result.fail('Invalid leaderboard type');
        }
        return Result.ok(new LeaderboardType({ value }));
    }
    static tokenBalance() {
        return LeaderboardType.create(LeaderboardTypeEnum.TOKEN_BALANCE);
    }
    static tokenEarned() {
        return LeaderboardType.create(LeaderboardTypeEnum.TOKEN_EARNED);
    }
    static achievements() {
        return LeaderboardType.create(LeaderboardTypeEnum.ACHIEVEMENTS);
    }
    static weeklyTokens() {
        return LeaderboardType.create(LeaderboardTypeEnum.WEEKLY_TOKENS);
    }
    static monthlyTokens() {
        return LeaderboardType.create(LeaderboardTypeEnum.MONTHLY_TOKENS);
    }
    getDisplayName() {
        switch (this.value) {
            case LeaderboardTypeEnum.TOKEN_BALANCE:
                return '현재 토큰 잔액';
            case LeaderboardTypeEnum.TOKEN_EARNED:
                return '총 획득 토큰';
            case LeaderboardTypeEnum.ACHIEVEMENTS:
                return '업적 개수';
            case LeaderboardTypeEnum.WEEKLY_TOKENS:
                return '이번 주 토큰';
            case LeaderboardTypeEnum.MONTHLY_TOKENS:
                return '이번 달 토큰';
            default:
                return '알 수 없음';
        }
    }
    equals(other) {
        return this.value === other.value;
    }
}
//# sourceMappingURL=LeaderboardType.js.map