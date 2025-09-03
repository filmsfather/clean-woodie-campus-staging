import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
import { Guard } from '../../common/Guard';
import { SrsPolicy } from '../services/SrsPolicy';
export class ReviewInterval extends ValueObject {
    static MIN_INTERVAL_DAYS = SrsPolicy.MIN_INTERVAL_DAYS;
    static INITIAL_INTERVAL_DAYS = SrsPolicy.INITIAL_INTERVAL_DAYS;
    static MAX_INTERVAL_DAYS = SrsPolicy.MAX_INTERVAL_DAYS;
    get days() {
        return this.props.days;
    }
    // 편의 메서드들
    get hours() {
        return this.days * 24;
    }
    get minutes() {
        return this.hours * 60;
    }
    constructor(props) {
        super(props);
    }
    static create(days) {
        const nullOrUndefinedGuard = Guard.againstNullOrUndefined(days, 'days');
        if (nullOrUndefinedGuard.isFailure) {
            return Result.fail(nullOrUndefinedGuard.error);
        }
        const rangeGuard = Guard.inRange(days, this.MIN_INTERVAL_DAYS, this.MAX_INTERVAL_DAYS, 'days');
        if (rangeGuard.isFailure) {
            return Result.fail(rangeGuard.error);
        }
        return Result.ok(new ReviewInterval({ days }));
    }
    static initial() {
        return new ReviewInterval({ days: this.INITIAL_INTERVAL_DAYS });
    }
    static fromHours(hours) {
        return this.create(Math.ceil(hours / 24));
    }
    static fromMinutes(minutes) {
        return this.create(Math.ceil(minutes / (24 * 60)));
    }
    static immediate() {
        // 5분 후 재복습 - 최소 단위인 1일로 설정
        return new ReviewInterval({ days: 1 });
    }
    static fromDays(days) {
        const result = this.create(days);
        if (result.isFailure) {
            throw new Error(result.error);
        }
        return result.value;
    }
    /**
     * 간격에 배수 적용
     */
    multiplyBy(multiplier) {
        const newDays = Math.max(1, Math.round(this.days * multiplier));
        return ReviewInterval.create(newDays);
    }
    /**
     * 간격 증가
     */
    addDays(additionalDays) {
        return ReviewInterval.create(this.days + additionalDays);
    }
    /**
     * 최소 간격으로 설정
     */
    min(other) {
        return this.days <= other.days ? this : other;
    }
    /**
     * 최대 간격으로 설정
     */
    max(other) {
        return this.days >= other.days ? this : other;
    }
    /**
     * 특정 날짜에서 다음 리뷰 날짜 계산
     */
    getNextReviewDate(fromDate) {
        const nextDate = new Date(fromDate);
        nextDate.setDate(nextDate.getDate() + this.days);
        return nextDate;
    }
    /**
     * SpacedRepetitionCalculator와의 호환성을 위한 별칭
     */
    calculateNextReviewDate(fromDate) {
        return this.getNextReviewDate(fromDate);
    }
    /**
     * 간격 수준 평가
     */
    getIntervalLevel() {
        if (this.days <= 3)
            return 'short';
        if (this.days <= 30)
            return 'medium';
        return 'long';
    }
    /**
     * 두 간격 사이의 비율
     */
    ratioTo(other) {
        return this.days / other.days;
    }
}
//# sourceMappingURL=ReviewInterval.js.map