import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
interface ReviewFeedbackProps {
    value: ReviewFeedbackType;
}
export type ReviewFeedbackType = 'AGAIN' | 'HARD' | 'GOOD' | 'EASY';
export declare class ReviewFeedback extends ValueObject<ReviewFeedbackProps> {
    static readonly AGAIN: "AGAIN";
    static readonly HARD: "HARD";
    static readonly GOOD: "GOOD";
    static readonly EASY: "EASY";
    get value(): ReviewFeedbackType;
    private constructor();
    static create(value: ReviewFeedbackType): Result<ReviewFeedback>;
    static again(): ReviewFeedback;
    static hard(): ReviewFeedback;
    static good(): ReviewFeedback;
    static easy(): ReviewFeedback;
    isAgain(): boolean;
    isHard(): boolean;
    isGood(): boolean;
    isEasy(): boolean;
}
export {};
//# sourceMappingURL=ReviewFeedback.d.ts.map