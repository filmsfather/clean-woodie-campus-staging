import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
import { Guard } from '../../common/Guard';
import { ReviewInterval } from './ReviewInterval';
import { EaseFactor } from './EaseFactor';
export class ReviewState extends ValueObject {
    get interval() {
        return this.props.interval;
    }
    get easeFactor() {
        return this.props.easeFactor;
    }
    get reviewCount() {
        return this.props.reviewCount;
    }
    get lastReviewedAt() {
        return this.props.lastReviewedAt;
    }
    get nextReviewAt() {
        return this.props.nextReviewAt;
    }
    constructor(props) {
        super(props);
    }
    static create(props) {
        const { interval, easeFactor, reviewCount, lastReviewedAt, nextReviewAt } = props;
        const nullOrUndefinedGuard = Guard.againstNullOrUndefined(interval, 'interval');
        if (nullOrUndefinedGuard.isFailure) {
            return Result.fail(nullOrUndefinedGuard.error);
        }
        const easeFactorGuard = Guard.againstNullOrUndefined(easeFactor, 'easeFactor');
        if (easeFactorGuard.isFailure) {
            return Result.fail(easeFactorGuard.error);
        }
        const reviewCountGuard = Guard.againstNullOrUndefined(reviewCount, 'reviewCount');
        if (reviewCountGuard.isFailure) {
            return Result.fail(reviewCountGuard.error);
        }
        const reviewCountRangeGuard = Guard.againstAtLeast(reviewCount, 0, 'reviewCount');
        if (reviewCountRangeGuard.isFailure) {
            return Result.fail(reviewCountRangeGuard.error);
        }
        const nextReviewGuard = Guard.againstNullOrUndefined(nextReviewAt, 'nextReviewAt');
        if (nextReviewGuard.isFailure) {
            return Result.fail(nextReviewGuard.error);
        }
        return Result.ok(new ReviewState({
            interval,
            easeFactor,
            reviewCount,
            lastReviewedAt,
            nextReviewAt
        }));
    }
    static initial(nextReviewAt) {
        return new ReviewState({
            interval: ReviewInterval.initial(),
            easeFactor: EaseFactor.default(),
            reviewCount: 0,
            lastReviewedAt: null,
            nextReviewAt
        });
    }
    withNewReview(newInterval, newEaseFactor, reviewedAt) {
        const nextReviewAt = newInterval.calculateNextReviewDate(reviewedAt);
        return new ReviewState({
            interval: newInterval,
            easeFactor: newEaseFactor,
            reviewCount: this.reviewCount + 1,
            lastReviewedAt: reviewedAt,
            nextReviewAt
        });
    }
    isDue(currentDate = new Date()) {
        return currentDate.getTime() >= this.nextReviewAt.getTime();
    }
    isFirstReview() {
        return this.reviewCount === 0;
    }
    daysSinceLastReview(currentDate = new Date()) {
        if (!this.lastReviewedAt)
            return 0;
        const diffMs = currentDate.getTime() - this.lastReviewedAt.getTime();
        return Math.floor(diffMs / (1000 * 60 * 60 * 24));
    }
    /**
     * 복습 기한이 초과되었는지 확인
     */
    isOverdue(currentDate = new Date()) {
        return currentDate.getTime() > this.nextReviewAt.getTime();
    }
    /**
     * 복습까지 남은 시간 (분 단위)
     */
    minutesUntilDue(currentDate = new Date()) {
        const diffMs = this.nextReviewAt.getTime() - currentDate.getTime();
        return Math.floor(diffMs / (1000 * 60));
    }
    /**
     * 새로운 복습 시간으로 상태 생성
     */
    withNewReviewTime(newReviewTime) {
        return new ReviewState({
            interval: this.interval,
            easeFactor: this.easeFactor,
            reviewCount: this.reviewCount,
            lastReviewedAt: this.lastReviewedAt,
            nextReviewAt: newReviewTime
        });
    }
    /**
     * 새로운 간격으로 상태 생성
     */
    withNewInterval(intervalDays) {
        const newInterval = ReviewInterval.create(intervalDays);
        if (newInterval.isSuccess) {
            const nextReviewAt = this.lastReviewedAt
                ? newInterval.value.calculateNextReviewDate(this.lastReviewedAt)
                : this.nextReviewAt;
            return new ReviewState({
                interval: newInterval.value,
                easeFactor: this.easeFactor,
                reviewCount: this.reviewCount,
                lastReviewedAt: this.lastReviewedAt,
                nextReviewAt
            });
        }
        return this; // 실패 시 현재 상태 반환
    }
    /**
     * 새로운 Ease Factor로 상태 생성
     */
    withNewEaseFactor(newEaseFactor) {
        return new ReviewState({
            interval: this.interval,
            easeFactor: newEaseFactor,
            reviewCount: this.reviewCount,
            lastReviewedAt: this.lastReviewedAt,
            nextReviewAt: this.nextReviewAt
        });
    }
}
//# sourceMappingURL=ReviewState.js.map