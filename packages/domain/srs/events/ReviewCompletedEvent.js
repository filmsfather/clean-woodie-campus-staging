import { BaseDomainEvent } from '../../events/DomainEvent';
export class ReviewCompletedEvent extends BaseDomainEvent {
    eventType = 'ReviewCompleted';
    studentId;
    problemId;
    feedback;
    previousInterval;
    newInterval;
    previousEaseFactor;
    newEaseFactor;
    reviewCount;
    nextReviewAt;
    reviewOccurredAt;
    // StudyRecord 생성을 위한 추가 정보
    isCorrect;
    responseTime;
    answerContent;
    constructor(props) {
        super(props.aggregateId);
        this.studentId = props.studentId;
        this.problemId = props.problemId;
        this.feedback = props.feedback;
        this.previousInterval = props.previousInterval;
        this.newInterval = props.newInterval;
        this.previousEaseFactor = props.previousEaseFactor;
        this.newEaseFactor = props.newEaseFactor;
        this.reviewCount = props.reviewCount;
        this.nextReviewAt = props.nextReviewAt;
        this.reviewOccurredAt = props.occurredAt;
        this.isCorrect = props.isCorrect;
        this.responseTime = props.responseTime;
        this.answerContent = props.answerContent;
    }
    /**
     * 간격이 증가했는지 확인
     */
    hasIntervalIncreased() {
        return this.newInterval > this.previousInterval;
    }
    /**
     * 난이도 계수가 개선되었는지 확인
     */
    hasEaseFactorImproved() {
        return this.newEaseFactor > this.previousEaseFactor;
    }
    /**
     * 첫 번째 복습인지 확인
     */
    isFirstReview() {
        return this.reviewCount === 1;
    }
    /**
     * 실패한 복습인지 확인
     */
    isFailedReview() {
        return this.feedback === 'AGAIN';
    }
    /**
     * 완벽한 복습인지 확인 (쉬움 응답)
     */
    isPerfectReview() {
        return this.feedback === 'EASY';
    }
}
//# sourceMappingURL=ReviewCompletedEvent.js.map