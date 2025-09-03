import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
import { Guard } from '../../common/Guard';
import { SrsPolicy } from '../services/SrsPolicy';
export class EaseFactor extends ValueObject {
    static MIN_EASE_FACTOR = SrsPolicy.MIN_EASE_FACTOR;
    static DEFAULT_EASE_FACTOR = SrsPolicy.DEFAULT_EASE_FACTOR;
    static MAX_EASE_FACTOR = SrsPolicy.MAX_EASE_FACTOR;
    get value() {
        return this.props.value;
    }
    constructor(props) {
        super(props);
    }
    static create(value) {
        const nullOrUndefinedGuard = Guard.againstNullOrUndefined(value, 'value');
        if (nullOrUndefinedGuard.isFailure) {
            return Result.fail(nullOrUndefinedGuard.error);
        }
        const rangeGuard = Guard.inRange(value, this.MIN_EASE_FACTOR, this.MAX_EASE_FACTOR, 'value');
        if (rangeGuard.isFailure) {
            return Result.fail(rangeGuard.error);
        }
        return Result.ok(new EaseFactor({ value }));
    }
    static default() {
        return new EaseFactor({ value: this.DEFAULT_EASE_FACTOR });
    }
    static minimum() {
        return new EaseFactor({ value: this.MIN_EASE_FACTOR });
    }
    static maximum() {
        return new EaseFactor({ value: this.MAX_EASE_FACTOR });
    }
    /**
     * 피드백에 따른 난이도 계수 조정
     * SM-2 알고리즘 기반
     */
    adjustForFeedback(feedback) {
        let newValue = this.value;
        switch (feedback.value) {
            case 'AGAIN':
                newValue = Math.max(SrsPolicy.MIN_EASE_FACTOR, this.value - SrsPolicy.AGAIN_EASE_PENALTY);
                break;
            case 'HARD':
                newValue = Math.max(SrsPolicy.MIN_EASE_FACTOR, this.value - SrsPolicy.HARD_EASE_PENALTY);
                break;
            case 'GOOD':
                // 변화 없음
                break;
            case 'EASY':
                newValue = Math.min(SrsPolicy.MAX_EASE_FACTOR, this.value + SrsPolicy.EASY_EASE_BONUS);
                break;
        }
        return new EaseFactor({ value: newValue });
    }
    /**
     * 난이도 수준 평가
     */
    getDifficultyLevel() {
        if (this.value >= SrsPolicy.BEGINNER_EASE_THRESHOLD)
            return 'easy';
        if (this.value >= SrsPolicy.INTERMEDIATE_EASE_THRESHOLD)
            return 'medium';
        return 'hard';
    }
    /**
     * 두 난이도 계수 간의 차이
     */
    distanceFrom(other) {
        return Math.abs(this.value - other.value);
    }
    /**
     * 더 어려운 계수인지 확인
     */
    isHarderThan(other) {
        return this.value < other.value;
    }
}
//# sourceMappingURL=EaseFactor.js.map