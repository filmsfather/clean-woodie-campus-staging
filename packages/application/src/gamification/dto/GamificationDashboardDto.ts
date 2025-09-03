import { TokenStatsDto } from './TokenDto';
import { AchievementStatsDto, UserAchievementDto } from './AchievementDto';
import { LeaderboardDto } from './LeaderboardDto';
import { RewardDto, RedemptionStatsDto } from './RewardDto';

export interface GamificationDashboardDto {
  // 학생 정보
  studentId: string;
  studentName: string;
  
  // 토큰 정보
  tokenStats: TokenStatsDto;
  
  // 업적 정보
  achievementStats: AchievementStatsDto;
  recentAchievements: UserAchievementDto[];
  unnotifiedAchievements: UserAchievementDto[];
  
  // 리더보드 정보
  myRankings: {
    tokenBalance: { rank: number; percentile: number; score: number } | null;
    tokenEarned: { rank: number; percentile: number; score: number } | null;
    achievements: { rank: number; percentile: number; score: number } | null;
    weeklyTokens: { rank: number; percentile: number; score: number } | null;
  };
  
  // 추천 보상
  recommendedRewards: RewardDto[];
  
  // 교환 내역
  recentRedemptions: {
    id: string;
    rewardName: string;
    tokenCost: number;
    status: string;
    redeemedAt: string;
  }[];
  
  // 활동 피드
  activityFeed: {
    id: string;
    type: 'token_earned' | 'achievement_earned' | 'reward_redeemed' | 'rank_changed';
    title: string;
    description: string;
    timestamp: string;
    icon?: string;
    value?: number;
  }[];
  
  // 주간/월간 요약
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