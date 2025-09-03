import { ApplicationService } from '../../services/ApplicationService';
import { Result } from '../../../domain';
import { 
  GetGamificationDashboardUseCase,
  AwardTokensUseCase,
  RedeemRewardUseCase,
  GetLeaderboardsUseCase
} from '../use-cases';
import { 
  GamificationDashboardDto,
  TokenDto,
  RewardRedemptionDto,
  LeaderboardSummaryDto
} from '../dto';

export class GamificationApplicationService extends ApplicationService {
  constructor(
    private getDashboardUseCase: GetGamificationDashboardUseCase,
    private awardTokensUseCase: AwardTokensUseCase,
    private redeemRewardUseCase: RedeemRewardUseCase,
    private getLeaderboardsUseCase: GetLeaderboardsUseCase
  ) {
    super();
  }

  /**
   * 게임화 대시보드 데이터 조회
   */
  async getDashboard(studentId: string): Promise<Result<GamificationDashboardDto>> {
    return await this.getDashboardUseCase.execute({ studentId });
  }

  /**
   * 학생에게 토큰 지급
   */
  async awardTokens(
    studentId: string, 
    amount: number, 
    reason: string,
    checkAchievements: boolean = true
  ): Promise<Result<TokenDto>> {
    return await this.awardTokensUseCase.execute({
      studentId,
      amount,
      reason,
      checkAchievements
    });
  }

  /**
   * 보상 교환
   */
  async redeemReward(
    studentId: string,
    rewardCode: string
  ): Promise<Result<RewardRedemptionDto>> {
    return await this.redeemRewardUseCase.execute({
      studentId,
      rewardCode
    });
  }

  /**
   * 리더보드 조회
   */
  async getLeaderboards(
    studentId?: string,
    limit?: number
  ): Promise<Result<LeaderboardSummaryDto>> {
    return await this.getLeaderboardsUseCase.execute({
      studentId,
      limit
    });
  }

  /**
   * 퀴즈 완료 시 토큰 지급
   */
  async onQuizCompleted(
    studentId: string,
    score: number,
    totalQuestions: number
  ): Promise<Result<TokenDto>> {
    // 점수에 따른 토큰 계산 로직
    const accuracy = score / totalQuestions;
    let tokenAmount = 10; // 기본 토큰

    if (accuracy >= 0.9) {
      tokenAmount = 20; // 90% 이상 우수
    } else if (accuracy >= 0.8) {
      tokenAmount = 15; // 80% 이상 양호
    }

    return await this.awardTokens(
      studentId,
      tokenAmount,
      `Quiz completed: ${score}/${totalQuestions} (${Math.round(accuracy * 100)}%)`
    );
  }

  /**
   * 과제 제출 시 토큰 지급
   */
  async onAssignmentSubmitted(
    studentId: string,
    isOnTime: boolean = true
  ): Promise<Result<TokenDto>> {
    const tokenAmount = isOnTime ? 25 : 15; // 기한 내 제출 시 보너스
    const reason = isOnTime ? 'Assignment submitted on time' : 'Assignment submitted';

    return await this.awardTokens(studentId, tokenAmount, reason);
  }

  /**
   * 출석 시 토큰 지급
   */
  async onAttendance(
    studentId: string,
    consecutiveDays: number = 1
  ): Promise<Result<TokenDto>> {
    // 연속 출석에 따른 보너스
    let tokenAmount = 5; // 기본 출석 토큰
    
    if (consecutiveDays >= 7) {
      tokenAmount = 15; // 7일 연속 보너스
    } else if (consecutiveDays >= 3) {
      tokenAmount = 10; // 3일 연속 보너스
    }

    return await this.awardTokens(
      studentId,
      tokenAmount,
      `Daily attendance (${consecutiveDays} consecutive days)`
    );
  }

  /**
   * 학습 목표 달성 시 토큰 지급
   */
  async onGoalAchieved(
    studentId: string,
    goalType: 'daily' | 'weekly' | 'monthly',
    goalName: string
  ): Promise<Result<TokenDto>> {
    const tokenAmounts = {
      daily: 30,
      weekly: 100,
      monthly: 300
    };

    const tokenAmount = tokenAmounts[goalType];

    return await this.awardTokens(
      studentId,
      tokenAmount,
      `${goalType} goal achieved: ${goalName}`
    );
  }
}