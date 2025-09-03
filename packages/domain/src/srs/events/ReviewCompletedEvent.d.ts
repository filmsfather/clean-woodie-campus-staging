import { BaseDomainEvent } from '../../events/DomainEvent';
import { ReviewFeedbackType } from '../value-objects/ReviewFeedback';
interface ReviewCompletedEventProps {
    aggregateId: string;
    studentId: string;
    problemId: string;
    feedback: ReviewFeedbackType;
    previousInterval: number;
    newInterval: number;
    previousEaseFactor: number;
    newEaseFactor: number;
    reviewCount: number;
    nextReviewAt: Date;
    occurredAt: Date;
    isCorrect: boolean;
    responseTime?: number;
    answerContent?: any;
}
export declare class ReviewCompletedEvent extends BaseDomainEvent {
    readonly eventType = "ReviewCompleted";
    readonly aggregateId: string;
    readonly studentId: string;
    readonly problemId: string;
    readonly feedback: ReviewFeedbackType;
    readonly previousInterval: number;
    readonly newInterval: number;
    readonly previousEaseFactor: number;
    readonly newEaseFactor: number;
    readonly reviewCount: number;
    readonly nextReviewAt: Date;
    readonly reviewOccurredAt: Date;
    readonly isCorrect: boolean;
    readonly responseTime?: number;
    readonly answerContent?: any;
    constructor(props: ReviewCompletedEventProps);
    /**
     * 간격이 증가했는지 확인
     */
    hasIntervalIncreased(): boolean;
    /**
     * 난이도 계수가 개선되었는지 확인
     */
    hasEaseFactorImproved(): boolean;
    /**
     * 첫 번째 복습인지 확인
     */
    isFirstReview(): boolean;
    /**
     * 실패한 복습인지 확인
     */
    isFailedReview(): boolean;
    /**
     * 완벽한 복습인지 확인 (쉬움 응답)
     */
    isPerfectReview(): boolean;
}
export {};
//# sourceMappingURL=ReviewCompletedEvent.d.ts.map