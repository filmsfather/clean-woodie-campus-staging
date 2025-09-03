export interface AchievementDto {
  id: string;
  code: string;
  name: string;
  description: string;
  iconUrl?: string;
  tokenReward: number;
  isActive: boolean;
  createdAt: string;
}

export interface UserAchievementDto {
  id: string;
  studentId: string;
  achievementId: string;
  achievement?: AchievementDto;
  earnedAt: string;
  notified: boolean;
  isRecent: boolean;
}

export interface AchievementProgressDto {
  achievement: AchievementDto;
  isEarned: boolean;
  earnedAt?: string;
  progress?: {
    current: number;
    target: number;
    percentage: number;
  };
}

export interface AchievementStatsDto {
  totalCount: number;
  recentCount: number;
  unnotifiedCount: number;
  categories: {
    [category: string]: number;
  };
}