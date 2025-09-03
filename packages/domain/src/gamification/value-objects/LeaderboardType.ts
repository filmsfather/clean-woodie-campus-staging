import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';

export enum LeaderboardTypeEnum {
  TOKEN_BALANCE = 'token_balance',
  TOKEN_EARNED = 'token_earned',
  ACHIEVEMENTS = 'achievements',
  WEEKLY_TOKENS = 'weekly_tokens',
  MONTHLY_TOKENS = 'monthly_tokens'
}

interface LeaderboardTypeProps {
  value: LeaderboardTypeEnum;
}

/**
 * 리더보드 타입 값 객체
 * 어떤 기준으로 순위를 매기는지 정의합니다
 */
export class LeaderboardType extends ValueObject<LeaderboardTypeProps> {
  get value(): LeaderboardTypeEnum {
    return this.props.value;
  }

  public static create(value: LeaderboardTypeEnum): Result<LeaderboardType> {
    if (!Object.values(LeaderboardTypeEnum).includes(value)) {
      return Result.fail('Invalid leaderboard type');
    }

    return Result.ok(new LeaderboardType({ value }));
  }

  public static tokenBalance(): Result<LeaderboardType> {
    return LeaderboardType.create(LeaderboardTypeEnum.TOKEN_BALANCE);
  }

  public static tokenEarned(): Result<LeaderboardType> {
    return LeaderboardType.create(LeaderboardTypeEnum.TOKEN_EARNED);
  }

  public static achievements(): Result<LeaderboardType> {
    return LeaderboardType.create(LeaderboardTypeEnum.ACHIEVEMENTS);
  }

  public static weeklyTokens(): Result<LeaderboardType> {
    return LeaderboardType.create(LeaderboardTypeEnum.WEEKLY_TOKENS);
  }

  public static monthlyTokens(): Result<LeaderboardType> {
    return LeaderboardType.create(LeaderboardTypeEnum.MONTHLY_TOKENS);
  }

  public getDisplayName(): string {
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

  public equals(other: LeaderboardType): boolean {
    return this.value === other.value;
  }
}