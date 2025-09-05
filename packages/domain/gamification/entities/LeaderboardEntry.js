import { Entity } from '../../entities/Entity';
import { Result } from '../../common/Result';
/**
 * 리더보드 항목 엔티티
 * 특정 학생의 리더보드 순위와 점수를 나타냅니다
 */
export class LeaderboardEntry extends Entity {
    get studentId() {
        return this.props.studentId;
    }
    get rank() {
        return this.props.rank;
    }
    get score() {
        return this.props.score;
    }
    get leaderboardType() {
        return this.props.leaderboardType;
    }
    get periodStart() {
        return this.props.periodStart;
    }
    get periodEnd() {
        return this.props.periodEnd;
    }
    get updatedAt() {
        return this.props.updatedAt;
    }
    static create(props, id) {
        // 비즈니스 규칙 검증
        if (props.rank <= 0) {
            return Result.fail('Rank must be positive');
        }
        if (props.score < 0) {
            return Result.fail('Score cannot be negative');
        }
        if (props.periodStart && props.periodEnd && props.periodStart >= props.periodEnd) {
            return Result.fail('Period start must be before period end');
        }
        const entry = new LeaderboardEntry(props, id);
        return Result.ok(entry);
    }
    /**
     * 순위를 업데이트합니다
     */
    updateRank(newRank) {
        if (newRank <= 0) {
            return Result.fail('Rank must be positive');
        }
        this.props.rank = newRank;
        this.props.updatedAt = new Date();
        return Result.ok();
    }
    /**
     * 점수를 업데이트합니다
     */
    updateScore(newScore) {
        if (newScore < 0) {
            return Result.fail('Score cannot be negative');
        }
        this.props.score = newScore;
        this.props.updatedAt = new Date();
        return Result.ok();
    }
    /**
     * 순위와 점수를 동시에 업데이트합니다
     */
    updateRankAndScore(newRank, newScore) {
        if (newRank <= 0) {
            return Result.fail('Rank must be positive');
        }
        if (newScore < 0) {
            return Result.fail('Score cannot be negative');
        }
        this.props.rank = newRank;
        this.props.score = newScore;
        this.props.updatedAt = new Date();
        return Result.ok();
    }
    /**
     * 상위 순위인지 확인합니다 (3위 이내)
     */
    isTopRank() {
        return this.props.rank <= 3;
    }
    /**
     * 순위 변동을 계산합니다
     */
    calculateRankChange(previousRank) {
        if (previousRank === undefined) {
            return 0;
        }
        return previousRank - this.props.rank; // 양수면 순위 상승, 음수면 하락
    }
    /**
     * 기간이 설정된 리더보드인지 확인합니다
     */
    hasPeriod() {
        return this.props.periodStart !== undefined && this.props.periodEnd !== undefined;
    }
}
//# sourceMappingURL=LeaderboardEntry.js.map