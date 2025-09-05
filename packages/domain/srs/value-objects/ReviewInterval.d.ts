import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
interface ReviewIntervalProps {
    days: number;
}
export declare class ReviewInterval extends ValueObject<ReviewIntervalProps> {
    static readonly MIN_INTERVAL_DAYS = 1;
    static readonly INITIAL_INTERVAL_DAYS = 1;
    static readonly MAX_INTERVAL_DAYS = 30;
    get days(): number;
    get hours(): number;
    get minutes(): number;
    private constructor();
    static create(days: number): Result<ReviewInterval>;
    static initial(): ReviewInterval;
    static fromHours(hours: number): Result<ReviewInterval>;
    static fromMinutes(minutes: number): Result<ReviewInterval>;
    static immediate(): ReviewInterval;
    static fromDays(days: number): ReviewInterval;
    /**
     * 간격에 배수 적용
     */
    multiplyBy(multiplier: number): Result<ReviewInterval>;
    /**
     * 간격 증가
     */
    addDays(additionalDays: number): Result<ReviewInterval>;
    /**
     * 최소 간격으로 설정
     */
    min(other: ReviewInterval): ReviewInterval;
    /**
     * 최대 간격으로 설정
     */
    max(other: ReviewInterval): ReviewInterval;
    /**
     * 특정 날짜에서 다음 리뷰 날짜 계산
     */
    getNextReviewDate(fromDate: Date): Date;
    /**
     * SpacedRepetitionCalculator와의 호환성을 위한 별칭
     */
    calculateNextReviewDate(fromDate: Date): Date;
    /**
     * 간격 수준 평가
     */
    getIntervalLevel(): 'short' | 'medium' | 'long';
    /**
     * 두 간격 사이의 비율
     */
    ratioTo(other: ReviewInterval): number;
}
export {};
//# sourceMappingURL=ReviewInterval.d.ts.map