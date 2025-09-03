import { BaseDomainEvent } from '../../events/DomainEvent';
import { UniqueEntityID } from '../../common/Identifier';
/**
 * 통계 업데이트 이벤트
 * 학생의 문제집별 학습 통계가 업데이트되었을 때 발생
 *
 * 사용 시나리오:
 * - 실시간 대시보드 업데이트
 * - 학습 분석 시스템 연동
 * - 진도율 알림 발송
 */
export declare class StatisticsUpdatedEvent extends BaseDomainEvent {
    readonly studentId: UniqueEntityID;
    readonly problemSetId: UniqueEntityID;
    readonly previousStats: {
        completedProblems: number;
        correctAnswers: number;
        completionRate: number;
        accuracyRate: number;
    };
    readonly currentStats: {
        completedProblems: number;
        correctAnswers: number;
        completionRate: number;
        accuracyRate: number;
    };
    readonly isCompleted: boolean;
    readonly performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F';
    readonly eventType = "StatisticsUpdated";
    constructor(studentId: UniqueEntityID, problemSetId: UniqueEntityID, previousStats: {
        completedProblems: number;
        correctAnswers: number;
        completionRate: number;
        accuracyRate: number;
    }, currentStats: {
        completedProblems: number;
        correctAnswers: number;
        completionRate: number;
        accuracyRate: number;
    }, isCompleted: boolean, // 문제집을 완료했는지
    performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F');
    /**
     * 문제집을 방금 완료했는지 확인
     */
    wasJustCompleted(): boolean;
    /**
     * 성취도가 향상되었는지 확인
     */
    hasImprovedPerformance(): boolean;
    /**
     * 완료한 문제 수 증가량
     */
    getCompletedProblemsIncrease(): number;
    /**
     * 완료율 증가량
     */
    getCompletionRateIncrease(): number;
    /**
     * 정답률 변화량 (음수일 수 있음)
     */
    getAccuracyRateChange(): number;
    /**
     * 중요한 이정표인지 확인 (50%, 75%, 90%, 100% 완료)
     */
    isSignificantProgressMilestone(): boolean;
    /**
     * 우수한 성과인지 확인 (A 또는 B 등급)
     */
    isExcellentPerformance(): boolean;
}
//# sourceMappingURL=StatisticsUpdatedEvent.d.ts.map