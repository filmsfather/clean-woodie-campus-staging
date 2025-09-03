import { UseCase } from '../../use-cases/UseCase';
import { Result } from '@woodie/domain';
import { GamificationDashboardDto } from '../dto/GamificationDashboardDto';
import { 
  TokenService,
  AchievementService,
  LeaderboardService,
  RewardRedemptionService,
  StudentId
} from '@woodie/domain';

interface GetGamificationDashboardRequest {
  studentId: string;
}

type GetGamificationDashboardResponse = GamificationDashboardDto;

export class GetGamificationDashboardUseCase 
  implements UseCase<GetGamificationDashboardRequest, GetGamificationDashboardResponse> {

  constructor(
    private tokenService: TokenService,
    private achievementService: AchievementService,
    private leaderboardService: LeaderboardService,
    private rewardRedemptionService: RewardRedemptionService
  ) {}

  async execute(request: GetGamificationDashboardRequest): Promise<Result<GetGamificationDashboardResponse>> {
    const studentIdResult = StudentId.create(request.studentId);
    if (studentIdResult.isFailure) {
      return Result.fail(studentIdResult.getErrorValue());
    }

    const studentId = studentIdResult.getValue();

    try {
      // 병렬로 데이터 조회
      const [
        tokenResult,
        achievementsResult,
        rankingsResult,
        rewardsResult,
        redemptionsResult
      ] = await Promise.all([
        this.getTokenStats(studentId),
        this.getAchievementStats(studentId),
        this.getRankings(studentId),
        this.getRecommendedRewards(studentId),
        this.getRecentRedemptions(studentId)
      ]);

      // 활동 피드 생성
      const activityFeed = await this.generateActivityFeed(studentId);
      
      // 진행 상황 계산
      const weeklyProgress = await this.calculateWeeklyProgress(studentId);
      const monthlyProgress = await this.calculateMonthlyProgress(studentId);

      const dashboard: GamificationDashboardDto = {
        studentId: request.studentId,
        studentName: 'Student Name', // TODO: 실제 학생 이름 조회
        tokenStats: tokenResult.isSuccess ? tokenResult.getValue() : {
          totalBalance: 0,
          totalEarned: 0,
          totalSpent: 0,
          recentEarnings: 0
        },
        achievementStats: achievementsResult.isSuccess ? achievementsResult.getValue().stats : {
          totalCount: 0,
          recentCount: 0,
          unnotifiedCount: 0,
          categories: {}
        },
        recentAchievements: achievementsResult.isSuccess ? achievementsResult.getValue().achievements.slice(0, 5) : [],
        unnotifiedAchievements: achievementsResult.isSuccess ? achievementsResult.getValue().achievements.filter((a: any) => !a.notified) : [],
        myRankings: rankingsResult.isSuccess ? rankingsResult.getValue() : {
          tokenBalance: null,
          tokenEarned: null,
          achievements: null,
          weeklyTokens: null
        },
        recommendedRewards: rewardsResult.isSuccess ? rewardsResult.getValue() : [],
        recentRedemptions: redemptionsResult.isSuccess ? redemptionsResult.getValue() : [],
        activityFeed,
        weeklyProgress,
        monthlyProgress
      };

      return Result.ok(dashboard);

    } catch (error) {
      return Result.fail(`Failed to load gamification dashboard: ${error}`);
    }
  }

  private async getTokenStats(studentId: StudentId): Promise<Result<any>> {
    const tokenResult = await this.tokenService.getTokenInfo(studentId);
    if (tokenResult.isFailure) {
      return Result.fail(tokenResult.getErrorValue());
    }

    const token = tokenResult.getValue();
    return Result.ok({
      totalBalance: token.balance.value,
      totalEarned: token.totalEarned.value,
      totalSpent: token.totalSpent.value,
      recentEarnings: 0 // TODO: 최근 7일 획득량 계산
    });
  }

  private async getAchievementStats(studentId: StudentId): Promise<Result<any>> {
    return await this.achievementService.getStudentAchievements(studentId);
  }

  private async getRankings(studentId: StudentId): Promise<Result<any>> {
    // TODO: 각 리더보드에서의 순위 조회
    return Result.ok({
      tokenBalance: null,
      tokenEarned: null,
      achievements: null,
      weeklyTokens: null
    });
  }

  private async getRecommendedRewards(studentId: StudentId): Promise<Result<any[]>> {
    const rewardsResult = await this.rewardRedemptionService.getAffordableRewards(studentId);
    if (rewardsResult.isFailure) {
      return Result.fail(rewardsResult.getErrorValue());
    }

    // 추천 로직: 가격 순으로 정렬하여 상위 3개
    const rewards = rewardsResult.getValue()
      .sort((a: any, b: any) => a.tokenCost.value - b.tokenCost.value)
      .slice(0, 3);

    return Result.ok(rewards);
  }

  private async getRecentRedemptions(studentId: StudentId): Promise<Result<any[]>> {
    const redemptionsResult = await this.rewardRedemptionService.getStudentRedemptionHistory(studentId, undefined, 5);
    if (redemptionsResult.isFailure) {
      return Result.fail(redemptionsResult.getErrorValue());
    }

    return Result.ok(redemptionsResult.getValue().map(r => ({
      id: r.id.toString(),
      rewardName: 'Reward Name', // TODO: 보상 이름 조회
      tokenCost: r.tokenCost.value,
      status: r.status,
      redeemedAt: r.redeemedAt.toISOString()
    })));
  }

  private async generateActivityFeed(studentId: StudentId): Promise<any[]> {
    // TODO: 최근 활동들을 시간순으로 정렬하여 피드 생성
    return [];
  }

  private async calculateWeeklyProgress(studentId: StudentId): Promise<any> {
    // TODO: 이번 주 진행 상황 계산
    return {
      tokensEarned: 0,
      achievementsEarned: 0,
      rankImprovement: 0
    };
  }

  private async calculateMonthlyProgress(studentId: StudentId): Promise<any> {
    // TODO: 이번 달 진행 상황 계산
    return {
      tokensEarned: 0,
      achievementsEarned: 0,
      rewardsRedeemed: 0,
      topCategory: 'learning'
    };
  }
}