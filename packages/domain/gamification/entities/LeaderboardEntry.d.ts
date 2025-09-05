import { Entity } from '../../entities/Entity';
import { UniqueEntityID } from '../../common/Identifier';
import { Result } from '../../common/Result';
import { StudentId } from '../../assignments/value-objects/StudentId';
import { LeaderboardType } from '../value-objects/LeaderboardType';
export interface LeaderboardEntryProps {
    studentId: StudentId;
    rank: number;
    score: number;
    leaderboardType: LeaderboardType;
    periodStart?: Date;
    periodEnd?: Date;
    updatedAt: Date;
}
/**
 * 리더보드 항목 엔티티
 * 특정 학생의 리더보드 순위와 점수를 나타냅니다
 */
export declare class LeaderboardEntry extends Entity<LeaderboardEntryProps> {
    get studentId(): StudentId;
    get rank(): number;
    get score(): number;
    get leaderboardType(): LeaderboardType;
    get periodStart(): Date | undefined;
    get periodEnd(): Date | undefined;
    get updatedAt(): Date;
    static create(props: LeaderboardEntryProps, id?: UniqueEntityID): Result<LeaderboardEntry>;
    /**
     * 순위를 업데이트합니다
     */
    updateRank(newRank: number): Result<void>;
    /**
     * 점수를 업데이트합니다
     */
    updateScore(newScore: number): Result<void>;
    /**
     * 순위와 점수를 동시에 업데이트합니다
     */
    updateRankAndScore(newRank: number, newScore: number): Result<void>;
    /**
     * 상위 순위인지 확인합니다 (3위 이내)
     */
    isTopRank(): boolean;
    /**
     * 순위 변동을 계산합니다
     */
    calculateRankChange(previousRank?: number): number;
    /**
     * 기간이 설정된 리더보드인지 확인합니다
     */
    hasPeriod(): boolean;
}
//# sourceMappingURL=LeaderboardEntry.d.ts.map