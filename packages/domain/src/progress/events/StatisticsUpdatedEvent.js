import { BaseDomainEvent } from '../../events/DomainEvent';
/**
 * 통계 업데이트 이벤트
 * 학생의 문제집별 학습 통계가 업데이트되었을 때 발생
 *
 * 사용 시나리오:
 * - 실시간 대시보드 업데이트
 * - 학습 분석 시스템 연동
 * - 진도율 알림 발송
 */
export class StatisticsUpdatedEvent extends BaseDomainEvent {
    studentId;
    problemSetId;
    previousStats;
    currentStats;
    isCompleted;
    performanceGrade;
    eventType = 'StatisticsUpdated';
    constructor(studentId, problemSetId, previousStats, currentStats, isCompleted, // 문제집을 완료했는지
    performanceGrade) {
        super();
        this.studentId = studentId;
        this.problemSetId = problemSetId;
        this.previousStats = previousStats;
        this.currentStats = currentStats;
        this.isCompleted = isCompleted;
        this.performanceGrade = performanceGrade;
    }
    /**
     * 문제집을 방금 완료했는지 확인
     */
    wasJustCompleted() {
        return this.isCompleted && this.previousStats.completionRate < 1.0;
    }
    /**
     * 성취도가 향상되었는지 확인
     */
    hasImprovedPerformance() {
        return this.currentStats.accuracyRate > this.previousStats.accuracyRate;
    }
    /**
     * 완료한 문제 수 증가량
     */
    getCompletedProblemsIncrease() {
        return this.currentStats.completedProblems - this.previousStats.completedProblems;
    }
    /**
     * 완료율 증가량
     */
    getCompletionRateIncrease() {
        return this.currentStats.completionRate - this.previousStats.completionRate;
    }
    /**
     * 정답률 변화량 (음수일 수 있음)
     */
    getAccuracyRateChange() {
        return this.currentStats.accuracyRate - this.previousStats.accuracyRate;
    }
    /**
     * 중요한 이정표인지 확인 (50%, 75%, 90%, 100% 완료)
     */
    isSignificantProgressMilestone() {
        const currentRate = this.currentStats.completionRate;
        const previousRate = this.previousStats.completionRate;
        const milestones = [0.5, 0.75, 0.9, 1.0];
        return milestones.some(milestone => previousRate < milestone && currentRate >= milestone);
    }
    /**
     * 우수한 성과인지 확인 (A 또는 B 등급)
     */
    isExcellentPerformance() {
        return this.performanceGrade === 'A' || this.performanceGrade === 'B';
    }
}
//# sourceMappingURL=StatisticsUpdatedEvent.js.map