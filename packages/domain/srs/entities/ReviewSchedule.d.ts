import { AggregateRoot } from '../../aggregates/AggregateRoot';
import { UniqueEntityID } from '../../common/Identifier';
import { Result } from '../../common/Result';
import { ReviewFeedback } from '../value-objects/ReviewFeedback';
import { ReviewState } from '../value-objects/ReviewState';
import { ISpacedRepetitionPolicy } from '../services/ISpacedRepetitionPolicy';
import { IClock } from '../services/IClock';
interface ReviewScheduleProps {
    studentId: UniqueEntityID;
    problemId: UniqueEntityID;
    reviewState: ReviewState;
    consecutiveFailures: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare class ReviewSchedule extends AggregateRoot<ReviewScheduleProps> {
    private constructor();
    get studentId(): UniqueEntityID;
    get problemId(): UniqueEntityID;
    get reviewState(): ReviewState;
    get consecutiveFailures(): number;
    get createdAt(): Date;
    get updatedAt(): Date;
    get currentInterval(): number;
    get easeFactor(): number;
    get reviewCount(): number;
    get lastReviewedAt(): Date | null;
    get nextReviewAt(): Date;
    /**
     * 새로운 ReviewSchedule 생성
     */
    static create(props: {
        studentId: UniqueEntityID;
        problemId: UniqueEntityID;
        reviewState: ReviewState;
        consecutiveFailures?: number;
    }, id?: UniqueEntityID): Result<ReviewSchedule>;
    /**
     * 재구성 팩토리 메서드 (DB에서 복원할 때 사용)
     */
    static reconstitute(props: ReviewScheduleProps, id: UniqueEntityID): ReviewSchedule;
    /**
     * 복습 피드백 처리 (StudyRecord 생성 정보 포함)
     * 의존성 주입을 통해 순수성 유지
     */
    processReviewFeedback(feedback: ReviewFeedback, policy: ISpacedRepetitionPolicy, clock: IClock, studyInfo?: {
        responseTime?: number;
        answerContent?: any;
    }): Result<void>;
    /**
     * 복습 예정 여부 확인
     */
    isDue(clock: IClock): boolean;
    /**
     * 복습 기한 초과 여부 확인
     */
    isOverdue(clock: IClock): boolean;
    /**
     * 복습까지 남은 시간 (분 단위)
     */
    minutesUntilDue(clock: IClock): number;
    /**
     * 현재 난이도 수준 평가
     */
    getDifficultyLevel(): 'beginner' | 'intermediate' | 'advanced';
    /**
     * 현재 기억 보존 확률 추정
     */
    getRetentionProbability(clock: IClock): number;
    /**
     * 연체 알림 이벤트 발행 (외부에서 호출)
     * 스케줄러나 백그라운드 작업에서 연체된 복습 감지 시 호출
     */
    triggerOverdueNotification(clock: IClock): void;
    /**
     * 알림 스케줄링 이벤트들 발행
     * 복습 완료 후 다음 복습에 대한 알림들을 예약
     */
    private scheduleNotificationEvents;
    /**
     * 추가 알림이 필요한지 판단
     * 어려운 문제나 연속 실패한 문제에 대해 더 많은 알림 제공
     */
    private shouldScheduleExtraReminders;
    /**
     * 복습이 완료되었는지 확인
     */
    isCompleted(): boolean;
    /**
     * 복습을 연기
     */
    postponeReview(hours: number): void;
    /**
     * 복습을 앞당기기
     */
    advanceReview(hours: number): void;
    /**
     * 다음 복습 시간 설정
     */
    setNextReviewTime(reviewTime: Date): void;
    /**
     * 간격 업데이트
     */
    updateInterval(intervalDays: number): void;
    /**
     * Ease Factor 업데이트
     */
    updateEaseFactor(easeFactor: number): void;
    /**
     * 우선순위 설정 (메타데이터로 처리)
     */
    setPriority(priority: 'low' | 'medium' | 'high'): void;
    /**
     * 노트 추가 (메타데이터로 처리)
     */
    addNote(note: string): void;
    /**
     * 업데이트 기록
     */
    recordUpdate(): void;
}
export {};
//# sourceMappingURL=ReviewSchedule.d.ts.map