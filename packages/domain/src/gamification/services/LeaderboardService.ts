import { Result } from '../../common/Result';
import { LeaderboardEntry } from '../entities/LeaderboardEntry';
import { LeaderboardType, LeaderboardTypeEnum } from '../value-objects/LeaderboardType';
import { StudentId } from '../../assignments/value-objects/StudentId';
import { ILeaderboardRepository } from '../repositories/ILeaderboardRepository';
import { IClock } from '../../srs/services/IClock';

export interface LeaderboardResult {
  type: LeaderboardType;
  entries: LeaderboardEntry[];
  totalEntries: number;
  lastUpdated: Date;
}

export interface StudentRankInfo {
  entry: LeaderboardEntry | null;
  totalParticipants: number;
  percentile?: number;
}

export class LeaderboardService {
  constructor(
    private leaderboardRepository: ILeaderboardRepository,
    private clock: IClock
  ) {}

  /**
   * 리더보드를 조회합니다
   */
  async getLeaderboard(
    type: LeaderboardType,
    limit: number = 10,
    periodStart?: Date,
    periodEnd?: Date
  ): Promise<Result<LeaderboardResult>> {
    const entriesResult = await this.leaderboardRepository.getLeaderboard(
      type,
      limit,
      periodStart,
      periodEnd
    );

    if (entriesResult.isFailure) {
      return Result.fail(entriesResult.getErrorValue());
    }

    const entries = entriesResult.getValue();

    return Result.ok({
      type,
      entries,
      totalEntries: entries.length,
      lastUpdated: this.clock.now()
    });
  }

  /**
   * 학생의 리더보드 순위 정보를 조회합니다
   */
  async getStudentRankInfo(
    studentId: StudentId,
    type: LeaderboardType,
    periodStart?: Date,
    periodEnd?: Date
  ): Promise<Result<StudentRankInfo>> {
    const entryResult = await this.leaderboardRepository.getStudentRank(
      studentId,
      type,
      periodStart,
      periodEnd
    );

    if (entryResult.isFailure) {
      return Result.fail(entryResult.getErrorValue());
    }

    const entry = entryResult.getValue();
    
    // 전체 참가자 수 조회를 위해 전체 리더보드 조회 (실제 구현에서는 최적화 필요)
    const fullLeaderboardResult = await this.leaderboardRepository.getLeaderboard(
      type,
      1000, // 충분히 큰 수
      periodStart,
      periodEnd
    );

    const totalParticipants = fullLeaderboardResult.isSuccess 
      ? fullLeaderboardResult.getValue().length 
      : 0;

    let percentile: number | undefined;
    if (entry && totalParticipants > 0) {
      percentile = Math.round((1 - (entry.rank - 1) / totalParticipants) * 100);
    }

    return Result.ok({
      entry,
      totalParticipants,
      percentile
    });
  }

  /**
   * 리더보드를 새로고침합니다 (데이터를 다시 계산하고 저장)
   */
  async refreshLeaderboard(type: LeaderboardType, limit: number = 100): Promise<Result<void>> {
    let rawDataResult: Result<{ studentId: StudentId; score: number }[]>;

    // 타입에 따라 데이터 조회 방식 결정
    switch (type.value) {
      case LeaderboardTypeEnum.TOKEN_BALANCE:
        rawDataResult = await this.leaderboardRepository.getTokenBalanceData(limit);
        break;
      case LeaderboardTypeEnum.TOKEN_EARNED:
        rawDataResult = await this.leaderboardRepository.getTokenEarnedData(limit);
        break;
      case LeaderboardTypeEnum.ACHIEVEMENTS:
        rawDataResult = await this.leaderboardRepository.getAchievementCountData(limit);
        break;
      case LeaderboardTypeEnum.WEEKLY_TOKENS:
        const weekStart = this.getWeekStart();
        const weekEnd = this.getWeekEnd();
        rawDataResult = await this.leaderboardRepository.getTokenEarnedByPeriodData(
          weekStart, weekEnd, limit
        );
        break;
      case LeaderboardTypeEnum.MONTHLY_TOKENS:
        const monthStart = this.getMonthStart();
        const monthEnd = this.getMonthEnd();
        rawDataResult = await this.leaderboardRepository.getTokenEarnedByPeriodData(
          monthStart, monthEnd, limit
        );
        break;
      default:
        return Result.fail('Unsupported leaderboard type');
    }

    if (rawDataResult.isFailure) {
      return Result.fail(rawDataResult.getErrorValue());
    }

    const rawData = rawDataResult.getValue();

    // 순위 계산 및 LeaderboardEntry 생성
    const entries: LeaderboardEntry[] = [];
    let currentRank = 1;
    let currentScore: number | null = null;
    let sameScoreCount = 0;

    for (const data of rawData) {
      // 동점자 처리
      if (currentScore !== null && data.score < currentScore) {
        currentRank += sameScoreCount;
        sameScoreCount = 1;
      } else if (currentScore !== null && data.score === currentScore) {
        sameScoreCount++;
      } else {
        sameScoreCount = 1;
      }

      currentScore = data.score;

      const entryProps = {
        studentId: data.studentId,
        rank: currentRank,
        score: data.score,
        leaderboardType: type,
        periodStart: this.getPeriodStart(type),
        periodEnd: this.getPeriodEnd(type),
        updatedAt: this.clock.now()
      };

      const entryResult = LeaderboardEntry.create(entryProps);
      if (entryResult.isSuccess) {
        entries.push(entryResult.getValue());
      }
    }

    // 일괄 저장
    const saveResult = await this.leaderboardRepository.saveBatch(entries);
    if (saveResult.isFailure) {
      return Result.fail(saveResult.getErrorValue());
    }

    return Result.ok();
  }

  /**
   * 모든 리더보드를 새로고침합니다
   */
  async refreshAllLeaderboards(): Promise<Result<void>> {
    const types = [
      LeaderboardType.tokenBalance(),
      LeaderboardType.tokenEarned(),
      LeaderboardType.achievements(),
      LeaderboardType.weeklyTokens(),
      LeaderboardType.monthlyTokens()
    ];

    for (const typeResult of types) {
      if (typeResult.isSuccess) {
        const refreshResult = await this.refreshLeaderboard(typeResult.getValue());
        if (refreshResult.isFailure) {
          return Result.fail(refreshResult.getErrorValue());
        }
      }
    }

    return Result.ok();
  }

  /**
   * 주요 리더보드들을 한번에 조회합니다
   */
  async getMainLeaderboards(limit: number = 10): Promise<Result<{
    tokenBalance: LeaderboardResult;
    tokenEarned: LeaderboardResult;
    achievements: LeaderboardResult;
    weeklyTokens: LeaderboardResult;
  }>> {
    const tokenBalanceResult = await this.getLeaderboard(
      (await LeaderboardType.tokenBalance()).getValue(),
      limit
    );

    const tokenEarnedResult = await this.getLeaderboard(
      (await LeaderboardType.tokenEarned()).getValue(),
      limit
    );

    const achievementsResult = await this.getLeaderboard(
      (await LeaderboardType.achievements()).getValue(),
      limit
    );

    const weeklyTokensResult = await this.getLeaderboard(
      (await LeaderboardType.weeklyTokens()).getValue(),
      limit,
      this.getWeekStart(),
      this.getWeekEnd()
    );

    if (tokenBalanceResult.isFailure || tokenEarnedResult.isFailure ||
        achievementsResult.isFailure || weeklyTokensResult.isFailure) {
      return Result.fail('Failed to load leaderboards');
    }

    return Result.ok({
      tokenBalance: tokenBalanceResult.getValue(),
      tokenEarned: tokenEarnedResult.getValue(),
      achievements: achievementsResult.getValue(),
      weeklyTokens: weeklyTokensResult.getValue()
    });
  }

  // 유틸리티 메서드들
  private getPeriodStart(type: LeaderboardType): Date | undefined {
    switch (type.value) {
      case LeaderboardTypeEnum.WEEKLY_TOKENS:
        return this.getWeekStart();
      case LeaderboardTypeEnum.MONTHLY_TOKENS:
        return this.getMonthStart();
      default:
        return undefined;
    }
  }

  private getPeriodEnd(type: LeaderboardType): Date | undefined {
    switch (type.value) {
      case LeaderboardTypeEnum.WEEKLY_TOKENS:
        return this.getWeekEnd();
      case LeaderboardTypeEnum.MONTHLY_TOKENS:
        return this.getMonthEnd();
      default:
        return undefined;
    }
  }

  private getWeekStart(): Date {
    const now = this.clock.now();
    const date = new Date(now);
    const day = date.getDay();
    const diff = date.getDate() - day;
    return new Date(date.setDate(diff));
  }

  private getWeekEnd(): Date {
    const weekStart = this.getWeekStart();
    return new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
  }

  private getMonthStart(): Date {
    const now = this.clock.now();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  private getMonthEnd(): Date {
    const now = this.clock.now();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }
}