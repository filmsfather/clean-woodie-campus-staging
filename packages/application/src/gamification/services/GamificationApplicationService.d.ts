import { ApplicationService } from '../../services/ApplicationService';
import { Result } from '@woodie/domain';
import { GetGamificationDashboardUseCase, AwardTokensUseCase, RedeemRewardUseCase, GetLeaderboardsUseCase } from '../use-cases';
import { GamificationDashboardDto, TokenDto, RewardRedemptionDto, LeaderboardSummaryDto } from '../dto';
export declare class GamificationApplicationService implements ApplicationService {
    private getDashboardUseCase;
    private awardTokensUseCase;
    private redeemRewardUseCase;
    private getLeaderboardsUseCase;
    readonly name = "GamificationApplicationService";
    constructor(getDashboardUseCase: GetGamificationDashboardUseCase, awardTokensUseCase: AwardTokensUseCase, redeemRewardUseCase: RedeemRewardUseCase, getLeaderboardsUseCase: GetLeaderboardsUseCase);
    /**
     * 게임화 대시보드 데이터 조회
     */
    getDashboard(studentId: string): Promise<Result<GamificationDashboardDto>>;
    /**
     * 학생에게 토큰 지급
     */
    awardTokens(studentId: string, amount: number, reason: string, checkAchievements?: boolean): Promise<Result<TokenDto>>;
    /**
     * 보상 교환
     */
    redeemReward(studentId: string, rewardCode: string): Promise<Result<RewardRedemptionDto>>;
    /**
     * 리더보드 조회
     */
    getLeaderboards(studentId?: string, limit?: number): Promise<Result<LeaderboardSummaryDto>>;
    /**
     * 퀴즈 완료 시 토큰 지급
     */
    onQuizCompleted(studentId: string, score: number, totalQuestions: number): Promise<Result<TokenDto>>;
    /**
     * 과제 제출 시 토큰 지급
     */
    onAssignmentSubmitted(studentId: string, isOnTime?: boolean): Promise<Result<TokenDto>>;
    /**
     * 출석 시 토큰 지급
     */
    onAttendance(studentId: string, consecutiveDays?: number): Promise<Result<TokenDto>>;
    /**
     * 학습 목표 달성 시 토큰 지급
     */
    onGoalAchieved(studentId: string, goalType: 'daily' | 'weekly' | 'monthly', goalName: string): Promise<Result<TokenDto>>;
}
//# sourceMappingURL=GamificationApplicationService.d.ts.map