import { AggregateRoot } from '../../aggregates/AggregateRoot';
import { Result } from '../../common/Result';
import { Guard } from '../../common/Guard';
import { StatisticsUpdatedEvent } from '../events/StatisticsUpdatedEvent';
/**
 * 학습 통계 엔티티
 * 학생의 문제집별 학습 통계를 추적하고 관리하는 도메인 엔티티
 *
 * 비즈니스 규칙:
 * - 완료한 문제 수는 총 문제 수를 초과할 수 없음
 * - 정답 수는 완료한 문제 수를 초과할 수 없음
 * - 모든 수치는 0 이상이어야 함
 * - 평균 응답 시간은 총 소요 시간과 완료한 문제 수로부터 계산됨
 */
export class Statistics extends AggregateRoot {
    constructor(props, id) {
        super(props, id);
    }
    get studentId() {
        return this.props.studentId;
    }
    get problemSetId() {
        return this.props.problemSetId;
    }
    get totalProblems() {
        return this.props.totalProblems;
    }
    get completedProblems() {
        return this.props.completedProblems;
    }
    get correctAnswers() {
        return this.props.correctAnswers;
    }
    get totalTimeSpent() {
        return this.props.totalTimeSpent;
    }
    get averageResponseTime() {
        return this.props.averageResponseTime;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    get updatedAt() {
        return this.props.updatedAt;
    }
    /**
     * 완료율 계산 (0-1 사이의 값)
     * @returns 완료한 문제 수 / 총 문제 수
     */
    getCompletionRate() {
        if (this.props.totalProblems === 0)
            return 0;
        return this.props.completedProblems / this.props.totalProblems;
    }
    /**
     * 정답률 계산 (0-1 사이의 값)
     * @returns 정답 수 / 완료한 문제 수
     */
    getAccuracyRate() {
        if (this.props.completedProblems === 0)
            return 0;
        return this.props.correctAnswers / this.props.completedProblems;
    }
    /**
     * 전체 정답률 계산 (0-1 사이의 값)
     * @returns 정답 수 / 총 문제 수
     */
    getOverallAccuracyRate() {
        if (this.props.totalProblems === 0)
            return 0;
        return this.props.correctAnswers / this.props.totalProblems;
    }
    /**
     * 문제집 완료 여부 확인
     * @returns 모든 문제를 완료했는지 여부
     */
    isCompleted() {
        return this.props.completedProblems >= this.props.totalProblems;
    }
    /**
     * 학습 진행 상태 확인
     * @returns 진행 상태 ('not_started' | 'in_progress' | 'completed')
     */
    getProgressStatus() {
        if (this.props.completedProblems === 0)
            return 'not_started';
        if (this.props.completedProblems >= this.props.totalProblems)
            return 'completed';
        return 'in_progress';
    }
    /**
     * 성과 등급 계산
     * 정답률을 기준으로 A, B, C, D, F 등급을 반환
     */
    getPerformanceGrade() {
        const accuracyRate = this.getAccuracyRate();
        if (accuracyRate >= 0.9)
            return 'A';
        if (accuracyRate >= 0.8)
            return 'B';
        if (accuracyRate >= 0.7)
            return 'C';
        if (accuracyRate >= 0.6)
            return 'D';
        return 'F';
    }
    /**
     * 평균 응답 시간 (초 단위)
     * @returns 평균 응답 시간을 초 단위로 반환
     */
    getAverageResponseTimeInSeconds() {
        return Math.round(this.props.averageResponseTime / 1000);
    }
    /**
     * 총 소요 시간 (분 단위)
     * @returns 총 소요 시간을 분 단위로 반환
     */
    getTotalTimeInMinutes() {
        return Math.round(this.props.totalTimeSpent / (1000 * 60));
    }
    /**
     * 학습 효율성 점수 계산 (0-100)
     * 정답률과 응답 시간을 종합적으로 고려한 효율성 점수
     */
    getEfficiencyScore() {
        const accuracyRate = this.getAccuracyRate();
        const avgResponseTime = this.getAverageResponseTimeInSeconds();
        // 기본 정확도 점수 (70%)
        let score = accuracyRate * 70;
        // 응답 시간 보너스/페널티 (30%)
        if (avgResponseTime <= 5) {
            score += 30; // 빠른 응답 보너스
        }
        else if (avgResponseTime <= 15) {
            score += 20; // 적당한 응답
        }
        else if (avgResponseTime <= 30) {
            score += 10; // 조금 느린 응답
        }
        else {
            score += 0; // 매우 느린 응답
        }
        return Math.max(0, Math.min(100, Math.round(score)));
    }
    /**
     * 새로운 학습 결과로 통계 업데이트
     *
     * @param isCorrect 정답 여부
     * @param responseTime 응답 시간 (밀리초)
     */
    recordStudyResult(isCorrect, responseTime) {
        // 이전 상태 저장 (이벤트 발행용)
        const previousStats = {
            completedProblems: this.props.completedProblems,
            correctAnswers: this.props.correctAnswers,
            completionRate: this.getCompletionRate(),
            accuracyRate: this.getAccuracyRate()
        };
        // 완료한 문제 수 증가
        this.props.completedProblems += 1;
        // 정답인 경우 정답 수 증가
        if (isCorrect) {
            this.props.correctAnswers += 1;
        }
        // 총 소요 시간 누적
        this.props.totalTimeSpent += responseTime;
        // 평균 응답 시간 재계산
        this.props.averageResponseTime = this.props.totalTimeSpent / this.props.completedProblems;
        this.props.updatedAt = new Date();
        // 현재 상태
        const currentStats = {
            completedProblems: this.props.completedProblems,
            correctAnswers: this.props.correctAnswers,
            completionRate: this.getCompletionRate(),
            accuracyRate: this.getAccuracyRate()
        };
        // 통계 업데이트 이벤트 발행
        this.addDomainEvent(new StatisticsUpdatedEvent(this.props.studentId, this.props.problemSetId, previousStats, currentStats, this.isCompleted(), this.getPerformanceGrade()));
    }
    /**
     * 통계 정보 업데이트 (배치 처리용)
     *
     * @param updateProps 업데이트할 속성들
     */
    updateStatistics(updateProps) {
        // 유효성 검증
        if (updateProps.completedProblems !== undefined && updateProps.totalProblems !== undefined) {
            if (updateProps.completedProblems > updateProps.totalProblems) {
                return Result.fail('완료한 문제 수는 총 문제 수를 초과할 수 없습니다');
            }
        }
        if (updateProps.correctAnswers !== undefined && updateProps.completedProblems !== undefined) {
            if (updateProps.correctAnswers > updateProps.completedProblems) {
                return Result.fail('정답 수는 완료한 문제 수를 초과할 수 없습니다');
            }
        }
        // 속성 업데이트
        if (updateProps.totalProblems !== undefined) {
            this.props.totalProblems = updateProps.totalProblems;
        }
        if (updateProps.completedProblems !== undefined) {
            this.props.completedProblems = updateProps.completedProblems;
        }
        if (updateProps.correctAnswers !== undefined) {
            this.props.correctAnswers = updateProps.correctAnswers;
        }
        if (updateProps.totalTimeSpent !== undefined) {
            this.props.totalTimeSpent = updateProps.totalTimeSpent;
        }
        if (updateProps.averageResponseTime !== undefined) {
            this.props.averageResponseTime = updateProps.averageResponseTime;
        }
        this.props.updatedAt = new Date();
        return Result.ok();
    }
    /**
     * Statistics 엔티티 생성
     *
     * @param props 통계 속성
     * @param id 엔티티 ID (선택적)
     * @returns Result<Statistics>
     */
    static create(props, id) {
        // 필수 속성 검증
        const guardResult = Guard.againstNullOrUndefinedBulk([
            { argument: props.studentId, argumentName: 'studentId' },
            { argument: props.problemSetId, argumentName: 'problemSetId' },
            { argument: props.totalProblems, argumentName: 'totalProblems' }
        ]);
        if (guardResult.isFailure) {
            return Result.fail(guardResult.error);
        }
        // 비즈니스 규칙 검증
        if (props.totalProblems < 0) {
            return Result.fail('총 문제 수는 음수가 될 수 없습니다');
        }
        const completedProblems = props.completedProblems ?? 0;
        const correctAnswers = props.correctAnswers ?? 0;
        const totalTimeSpent = props.totalTimeSpent ?? 0;
        const averageResponseTime = props.averageResponseTime ?? 0;
        if (completedProblems < 0) {
            return Result.fail('완료한 문제 수는 음수가 될 수 없습니다');
        }
        if (correctAnswers < 0) {
            return Result.fail('정답 수는 음수가 될 수 없습니다');
        }
        if (completedProblems > props.totalProblems) {
            return Result.fail('완료한 문제 수는 총 문제 수를 초과할 수 없습니다');
        }
        if (correctAnswers > completedProblems) {
            return Result.fail('정답 수는 완료한 문제 수를 초과할 수 없습니다');
        }
        if (totalTimeSpent < 0) {
            return Result.fail('총 소요 시간은 음수가 될 수 없습니다');
        }
        if (averageResponseTime < 0) {
            return Result.fail('평균 응답 시간은 음수가 될 수 없습니다');
        }
        const now = new Date();
        const statistics = new Statistics({
            studentId: props.studentId,
            problemSetId: props.problemSetId,
            totalProblems: props.totalProblems,
            completedProblems,
            correctAnswers,
            totalTimeSpent,
            averageResponseTime,
            createdAt: now,
            updatedAt: now
        }, id);
        return Result.ok(statistics);
    }
    /**
     * 재구성 팩토리 메서드 (DB에서 복원할 때 사용)
     *
     * @param props 전체 속성
     * @param id 엔티티 ID
     * @returns Statistics
     */
    static reconstitute(props, id) {
        return new Statistics(props, id);
    }
}
//# sourceMappingURL=Statistics.js.map