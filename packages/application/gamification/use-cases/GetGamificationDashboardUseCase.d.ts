import { UseCase } from '../../use-cases/UseCase';
import { Result } from '@woodie/domain';
import { GamificationDashboardDto } from '../dto/GamificationDashboardDto';
import { TokenService, AchievementService, LeaderboardService, RewardRedemptionService } from '@woodie/domain';
interface GetGamificationDashboardRequest {
    studentId: string;
}
type GetGamificationDashboardResponse = GamificationDashboardDto;
export declare class GetGamificationDashboardUseCase implements UseCase<GetGamificationDashboardRequest, GetGamificationDashboardResponse> {
    private tokenService;
    private achievementService;
    private leaderboardService;
    private rewardRedemptionService;
    constructor(tokenService: TokenService, achievementService: AchievementService, leaderboardService: LeaderboardService, rewardRedemptionService: RewardRedemptionService);
    execute(request: GetGamificationDashboardRequest): Promise<Result<GetGamificationDashboardResponse>>;
    private getTokenStats;
    private getAchievementStats;
    private getRankings;
    private getRecommendedRewards;
    private getRecentRedemptions;
    private generateActivityFeed;
    private calculateWeeklyProgress;
    private calculateMonthlyProgress;
}
export {};
//# sourceMappingURL=GetGamificationDashboardUseCase.d.ts.map