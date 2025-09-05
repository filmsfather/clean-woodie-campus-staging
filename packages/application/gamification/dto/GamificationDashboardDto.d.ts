import { TokenStatsDto } from './TokenDto';
import { AchievementStatsDto, UserAchievementDto } from './AchievementDto';
import { RewardDto } from './RewardDto';
export interface GamificationDashboardDto {
    studentId: string;
    studentName: string;
    tokenStats: TokenStatsDto;
    achievementStats: AchievementStatsDto;
    recentAchievements: UserAchievementDto[];
    unnotifiedAchievements: UserAchievementDto[];
    myRankings: {
        tokenBalance: {
            rank: number;
            percentile: number;
            score: number;
        } | null;
        tokenEarned: {
            rank: number;
            percentile: number;
            score: number;
        } | null;
        achievements: {
            rank: number;
            percentile: number;
            score: number;
        } | null;
        weeklyTokens: {
            rank: number;
            percentile: number;
            score: number;
        } | null;
    };
    recommendedRewards: RewardDto[];
    recentRedemptions: {
        id: string;
        rewardName: string;
        tokenCost: number;
        status: string;
        redeemedAt: string;
    }[];
    activityFeed: {
        id: string;
        type: 'token_earned' | 'achievement_earned' | 'reward_redeemed' | 'rank_changed';
        title: string;
        description: string;
        timestamp: string;
        icon?: string;
        value?: number;
    }[];
    weeklyProgress: {
        tokensEarned: number;
        achievementsEarned: number;
        rankImprovement: number;
        goal?: {
            target: number;
            current: number;
            percentage: number;
        };
    };
    monthlyProgress: {
        tokensEarned: number;
        achievementsEarned: number;
        rewardsRedeemed: number;
        topCategory: string;
    };
}
//# sourceMappingURL=GamificationDashboardDto.d.ts.map