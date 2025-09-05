import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
import { ReviewFeedback } from './ReviewFeedback';
interface EaseFactorProps {
    value: number;
}
export declare class EaseFactor extends ValueObject<EaseFactorProps> {
    static readonly MIN_EASE_FACTOR = 1.3;
    static readonly DEFAULT_EASE_FACTOR = 2.5;
    static readonly MAX_EASE_FACTOR = 4;
    get value(): number;
    private constructor();
    static create(value: number): Result<EaseFactor>;
    static default(): EaseFactor;
    static minimum(): EaseFactor;
    static maximum(): EaseFactor;
    /**
     * 피드백에 따른 난이도 계수 조정
     * SM-2 알고리즘 기반
     */
    adjustForFeedback(feedback: ReviewFeedback): EaseFactor;
    /**
     * 난이도 수준 평가
     */
    getDifficultyLevel(): 'easy' | 'medium' | 'hard';
    /**
     * 두 난이도 계수 간의 차이
     */
    distanceFrom(other: EaseFactor): number;
    /**
     * 더 어려운 계수인지 확인
     */
    isHarderThan(other: EaseFactor): boolean;
}
export {};
//# sourceMappingURL=EaseFactor.d.ts.map