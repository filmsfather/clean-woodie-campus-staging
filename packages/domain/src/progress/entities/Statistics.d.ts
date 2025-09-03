import { AggregateRoot } from '../../aggregates/AggregateRoot';
import { UniqueEntityID } from '../../common/Identifier';
import { Result } from '../../common/Result';
interface StatisticsProps {
    studentId: UniqueEntityID;
    problemSetId: UniqueEntityID;
    totalProblems: number;
    completedProblems: number;
    correctAnswers: number;
    totalTimeSpent: number;
    averageResponseTime: number;
    createdAt: Date;
    updatedAt: Date;
}
interface StatisticsUpdateProps {
    totalProblems?: number;
    completedProblems?: number;
    correctAnswers?: number;
    totalTimeSpent?: number;
    averageResponseTime?: number;
}
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
export declare class Statistics extends AggregateRoot<StatisticsProps> {
    private constructor();
    get studentId(): UniqueEntityID;
    get problemSetId(): UniqueEntityID;
    get totalProblems(): number;
    get completedProblems(): number;
    get correctAnswers(): number;
    get totalTimeSpent(): number;
    get averageResponseTime(): number;
    get createdAt(): Date;
    get updatedAt(): Date;
    /**
     * 완료율 계산 (0-1 사이의 값)
     * @returns 완료한 문제 수 / 총 문제 수
     */
    getCompletionRate(): number;
    /**
     * 정답률 계산 (0-1 사이의 값)
     * @returns 정답 수 / 완료한 문제 수
     */
    getAccuracyRate(): number;
    /**
     * 전체 정답률 계산 (0-1 사이의 값)
     * @returns 정답 수 / 총 문제 수
     */
    getOverallAccuracyRate(): number;
    /**
     * 문제집 완료 여부 확인
     * @returns 모든 문제를 완료했는지 여부
     */
    isCompleted(): boolean;
    /**
     * 학습 진행 상태 확인
     * @returns 진행 상태 ('not_started' | 'in_progress' | 'completed')
     */
    getProgressStatus(): 'not_started' | 'in_progress' | 'completed';
    /**
     * 성과 등급 계산
     * 정답률을 기준으로 A, B, C, D, F 등급을 반환
     */
    getPerformanceGrade(): 'A' | 'B' | 'C' | 'D' | 'F';
    /**
     * 평균 응답 시간 (초 단위)
     * @returns 평균 응답 시간을 초 단위로 반환
     */
    getAverageResponseTimeInSeconds(): number;
    /**
     * 총 소요 시간 (분 단위)
     * @returns 총 소요 시간을 분 단위로 반환
     */
    getTotalTimeInMinutes(): number;
    /**
     * 학습 효율성 점수 계산 (0-100)
     * 정답률과 응답 시간을 종합적으로 고려한 효율성 점수
     */
    getEfficiencyScore(): number;
    /**
     * 새로운 학습 결과로 통계 업데이트
     *
     * @param isCorrect 정답 여부
     * @param responseTime 응답 시간 (밀리초)
     */
    recordStudyResult(isCorrect: boolean, responseTime: number): void;
    /**
     * 통계 정보 업데이트 (배치 처리용)
     *
     * @param updateProps 업데이트할 속성들
     */
    updateStatistics(updateProps: StatisticsUpdateProps): Result<void>;
    /**
     * Statistics 엔티티 생성
     *
     * @param props 통계 속성
     * @param id 엔티티 ID (선택적)
     * @returns Result<Statistics>
     */
    static create(props: {
        studentId: UniqueEntityID;
        problemSetId: UniqueEntityID;
        totalProblems: number;
        completedProblems?: number;
        correctAnswers?: number;
        totalTimeSpent?: number;
        averageResponseTime?: number;
    }, id?: UniqueEntityID): Result<Statistics>;
    /**
     * 재구성 팩토리 메서드 (DB에서 복원할 때 사용)
     *
     * @param props 전체 속성
     * @param id 엔티티 ID
     * @returns Statistics
     */
    static reconstitute(props: StatisticsProps, id: UniqueEntityID): Statistics;
}
export {};
//# sourceMappingURL=Statistics.d.ts.map