export interface LeaderboardEntryDto {
  id: string;
  studentId: string;
  studentName: string;
  rank: number;
  score: number;
  rankChange?: number; // 이전 대비 순위 변화
  avatar?: string;
  badges?: string[]; // 특별 배지들
}

export interface LeaderboardDto {
  type: 'token_balance' | 'token_earned' | 'achievements' | 'weekly_tokens' | 'monthly_tokens';
  displayName: string;
  entries: LeaderboardEntryDto[];
  totalEntries: number;
  lastUpdated: string;
  periodStart?: string;
  periodEnd?: string;
  currentUserRank?: {
    rank: number;
    score: number;
    percentile: number;
  };
}

export interface LeaderboardSummaryDto {
  tokenBalance: LeaderboardDto;
  tokenEarned: LeaderboardDto;
  achievements: LeaderboardDto;
  weeklyTokens: LeaderboardDto;
}