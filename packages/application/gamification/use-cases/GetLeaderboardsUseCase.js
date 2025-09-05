import { Result } from '@woodie/domain';
import { StudentId } from '@woodie/domain';
export class GetLeaderboardsUseCase {
    leaderboardService;
    constructor(leaderboardService) {
        this.leaderboardService = leaderboardService;
    }
    async execute(request) {
        const limit = request.limit || 10;
        let studentId;
        if (request.studentId) {
            const studentIdResult = StudentId.create(request.studentId);
            if (studentIdResult.isFailure) {
                return Result.fail(studentIdResult.getErrorValue());
            }
            studentId = studentIdResult.getValue();
        }
        try {
            // 모든 주요 리더보드 조회
            const leaderboardsResult = await this.leaderboardService.getMainLeaderboards(limit);
            if (leaderboardsResult.isFailure) {
                return Result.fail(leaderboardsResult.getErrorValue());
            }
            const leaderboards = leaderboardsResult.getValue();
            // 사용자 순위 정보 조회 (있는 경우)
            let userRankings = {};
            if (studentId) {
                userRankings = await this.getUserRankings(studentId);
            }
            // DTO 변환
            const summary = {
                tokenBalance: {
                    type: 'token_balance',
                    displayName: '토큰 잔액',
                    entries: leaderboards.tokenBalance.entries.map(entry => ({
                        id: entry.id.toString(),
                        studentId: entry.studentId.value,
                        studentName: 'Student Name', // TODO: 실제 이름 조회
                        rank: entry.rank,
                        score: entry.score,
                        rankChange: entry.calculateRankChange(),
                        avatar: undefined,
                        badges: []
                    })),
                    totalEntries: leaderboards.tokenBalance.totalEntries,
                    lastUpdated: leaderboards.tokenBalance.lastUpdated.toISOString(),
                    currentUserRank: userRankings.tokenBalance
                },
                tokenEarned: {
                    type: 'token_earned',
                    displayName: '총 획득 토큰',
                    entries: leaderboards.tokenEarned.entries.map(entry => ({
                        id: entry.id.toString(),
                        studentId: entry.studentId.value,
                        studentName: 'Student Name',
                        rank: entry.rank,
                        score: entry.score,
                        rankChange: entry.calculateRankChange(),
                        avatar: undefined,
                        badges: []
                    })),
                    totalEntries: leaderboards.tokenEarned.totalEntries,
                    lastUpdated: leaderboards.tokenEarned.lastUpdated.toISOString(),
                    currentUserRank: userRankings.tokenEarned
                },
                achievements: {
                    type: 'achievements',
                    displayName: '업적 개수',
                    entries: leaderboards.achievements.entries.map(entry => ({
                        id: entry.id.toString(),
                        studentId: entry.studentId.value,
                        studentName: 'Student Name',
                        rank: entry.rank,
                        score: entry.score,
                        rankChange: entry.calculateRankChange(),
                        avatar: undefined,
                        badges: []
                    })),
                    totalEntries: leaderboards.achievements.totalEntries,
                    lastUpdated: leaderboards.achievements.lastUpdated.toISOString(),
                    currentUserRank: userRankings.achievements
                },
                weeklyTokens: {
                    type: 'weekly_tokens',
                    displayName: '이번 주 토큰',
                    entries: leaderboards.weeklyTokens.entries.map(entry => ({
                        id: entry.id.toString(),
                        studentId: entry.studentId.value,
                        studentName: 'Student Name',
                        rank: entry.rank,
                        score: entry.score,
                        rankChange: entry.calculateRankChange(),
                        avatar: undefined,
                        badges: []
                    })),
                    totalEntries: leaderboards.weeklyTokens.totalEntries,
                    lastUpdated: leaderboards.weeklyTokens.lastUpdated.toISOString(),
                    periodStart: leaderboards.weeklyTokens.entries[0]?.periodStart?.toISOString(),
                    periodEnd: leaderboards.weeklyTokens.entries[0]?.periodEnd?.toISOString(),
                    currentUserRank: userRankings.weeklyTokens
                }
            };
            return Result.ok(summary);
        }
        catch (error) {
            return Result.fail(`Failed to get leaderboards: ${error}`);
        }
    }
    async getUserRankings(studentId) {
        // TODO: 각 리더보드에서의 사용자 순위 조회
        return {
            tokenBalance: null,
            tokenEarned: null,
            achievements: null,
            weeklyTokens: null
        };
    }
}
//# sourceMappingURL=GetLeaderboardsUseCase.js.map