import { Result } from '../../common/Result';
import { LeaderboardEntry } from '../entities/LeaderboardEntry';
import { LeaderboardType } from '../value-objects/LeaderboardType';
import { StudentId } from '../../assignments/value-objects/StudentId';
import { ILeaderboardRepository } from '../repositories/ILeaderboardRepository';
import { IClock } from '../../srs/services/IClock';
export interface LeaderboardResult {
    type: LeaderboardType;
    entries: LeaderboardEntry[];
    totalEntries: number;
    lastUpdated: Date;
}
export interface StudentRankInfo {
    entry: LeaderboardEntry | null;
    totalParticipants: number;
    percentile?: number;
}
export declare class LeaderboardService {
    private leaderboardRepository;
    private clock;
    constructor(leaderboardRepository: ILeaderboardRepository, clock: IClock);
    /**
     * 리더보드를 조회합니다
     */
    getLeaderboard(type: LeaderboardType, limit?: number, periodStart?: Date, periodEnd?: Date): Promise<Result<LeaderboardResult>>;
    /**
     * 학생의 리더보드 순위 정보를 조회합니다
     */
    getStudentRankInfo(studentId: StudentId, type: LeaderboardType, periodStart?: Date, periodEnd?: Date): Promise<Result<StudentRankInfo>>;
    /**
     * 리더보드를 새로고침합니다 (데이터를 다시 계산하고 저장)
     */
    refreshLeaderboard(type: LeaderboardType, limit?: number): Promise<Result<void>>;
    /**
     * 모든 리더보드를 새로고침합니다
     */
    refreshAllLeaderboards(): Promise<Result<void>>;
    /**
     * 주요 리더보드들을 한번에 조회합니다
     */
    getMainLeaderboards(limit?: number): Promise<Result<{
        tokenBalance: LeaderboardResult;
        tokenEarned: LeaderboardResult;
        achievements: LeaderboardResult;
        weeklyTokens: LeaderboardResult;
    }>>;
    private getPeriodStart;
    private getPeriodEnd;
    private getWeekStart;
    private getWeekEnd;
    private getMonthStart;
    private getMonthEnd;
}
//# sourceMappingURL=LeaderboardService.d.ts.map