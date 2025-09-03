import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
import { ReviewInterval } from './ReviewInterval';
import { EaseFactor } from './EaseFactor';
interface ReviewStateProps {
    interval: ReviewInterval;
    easeFactor: EaseFactor;
    reviewCount: number;
    lastReviewedAt: Date | null;
    nextReviewAt: Date;
}
export declare class ReviewState extends ValueObject<ReviewStateProps> {
    get interval(): ReviewInterval;
    get easeFactor(): EaseFactor;
    get reviewCount(): number;
    get lastReviewedAt(): Date | null;
    get nextReviewAt(): Date;
    private constructor();
    static create(props: {
        interval: ReviewInterval;
        easeFactor: EaseFactor;
        reviewCount: number;
        lastReviewedAt: Date | null;
        nextReviewAt: Date;
    }): Result<ReviewState>;
    static initial(nextReviewAt: Date): ReviewState;
    withNewReview(newInterval: ReviewInterval, newEaseFactor: EaseFactor, reviewedAt: Date): ReviewState;
    isDue(currentDate?: Date): boolean;
    isFirstReview(): boolean;
    daysSinceLastReview(currentDate?: Date): number;
    /**
     * 복습 기한이 초과되었는지 확인
     */
    isOverdue(currentDate?: Date): boolean;
    /**
     * 복습까지 남은 시간 (분 단위)
     */
    minutesUntilDue(currentDate?: Date): number;
}
export {};
//# sourceMappingURL=ReviewState.d.ts.map