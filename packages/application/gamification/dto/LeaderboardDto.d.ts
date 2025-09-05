export interface LeaderboardEntryDto {
    id: string;
    studentId: string;
    studentName: string;
    rank: number;
    score: number;
    rankChange?: number;
    avatar?: string;
    badges?: string[];
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
//# sourceMappingURL=LeaderboardDto.d.ts.map