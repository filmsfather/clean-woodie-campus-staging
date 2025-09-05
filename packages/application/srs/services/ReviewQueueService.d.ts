import { UniqueEntityID, Result, IReviewScheduleRepository, IStudyRecordRepository, ISpacedRepetitionPolicy, IClock, ReviewFeedback } from '@woodie/domain';
export interface ReviewQueueItem {
    scheduleId: string;
    studentId: string;
    problemId: string;
    nextReviewAt: Date;
    currentInterval: number;
    easeFactor: number;
    reviewCount: number;
    consecutiveFailures: number;
    priority: 'high' | 'medium' | 'low';
    isOverdue: boolean;
    minutesUntilDue: number;
    difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
    retentionProbability: number;
}
export interface ReviewStatistics {
    totalScheduled: number;
    dueToday: number;
    overdue: number;
    completedToday: number;
    streakDays: number;
    averageRetention: number;
    totalTimeSpent: number;
}
export interface ReviewCompletionResult {
    scheduleId: string;
    previousInterval: number;
    newInterval: number;
    previousEaseFactor: number;
    newEaseFactor: number;
    nextReviewAt: Date;
    reviewCount: number;
}
/**
 * 복습 큐 관리 서비스 (Application Layer)
 * 의존성: Domain Layer만 의존 (Infrastructure 의존 제거)
 * 트랜잭션: Domain Event를 통한 원자성 보장
 */
export declare class ReviewQueueService {
    private reviewScheduleRepository;
    private studyRecordRepository;
    private spacedRepetitionPolicy;
    private clock;
    constructor(reviewScheduleRepository: IReviewScheduleRepository, // Domain 인터페이스
    studyRecordRepository: IStudyRecordRepository, // Domain 인터페이스  
    spacedRepetitionPolicy: ISpacedRepetitionPolicy, // Domain 인터페이스
    clock: IClock);
    /**
     * 오늘의 복습 항목 조회 (우선순위별 정렬)
     * 우선순위: 1) 연체된 항목 2) 마감일이 가까운 항목 3) 어려운 항목
     */
    getTodayReviews(studentId: UniqueEntityID): Promise<Result<ReviewQueueItem[]>>;
    /**
     * 지연된 복습 항목 조회
     */
    getOverdueReviews(studentId: UniqueEntityID): Promise<Result<ReviewQueueItem[]>>;
    /**
     * 복습 완료 처리 - 개선된 버전
     * 트랜잭션 경계: Domain Event를 통한 원자성 보장
     *
     * 1. ReviewSchedule에 피드백 처리 (Domain Logic + Event 발행)
     * 2. ReviewSchedule 저장 (Event도 함께 저장)
     * 3. Event Handler에서 StudyRecord 생성 (별도 트랜잭션)
     */
    markReviewCompleted(studentId: UniqueEntityID, scheduleId: UniqueEntityID, feedback: ReviewFeedback, responseTime?: number, answerContent?: any): Promise<Result<ReviewCompletionResult>>;
    /**
     * 복습 통계 조회
     */
    getReviewStatistics(studentId: UniqueEntityID): Promise<Result<ReviewStatistics>>;
    /**
     * ReviewSchedule를 ReviewQueueItem DTO로 변환
     */
    private toQueueItem;
    /**
     * 우선순위별 정렬
     */
    private sortByPriority;
    /**
     * 연속 학습 일수 계산
     */
    private calculateStreakDays;
    /**
     * 평균 정답률 계산
     */
    private calculateAverageRetention;
    /**
     * 총 학습 시간 계산 (분 단위)
     */
    private calculateTotalTimeSpent;
}
//# sourceMappingURL=ReviewQueueService.d.ts.map