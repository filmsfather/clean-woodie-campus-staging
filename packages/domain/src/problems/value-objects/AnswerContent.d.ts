import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
import { ProblemTypeValue } from './ProblemType';
export interface BaseAnswerContent {
    type: ProblemTypeValue;
    explanation?: string;
    points: number;
}
export declare namespace AnswerContent {
    interface MultipleChoice extends BaseAnswerContent {
        type: 'multiple_choice';
        correctChoices: string[];
    }
    interface ShortAnswer extends BaseAnswerContent {
        type: 'short_answer';
        acceptedAnswers: string[];
        caseSensitive?: boolean;
        trimWhitespace?: boolean;
    }
    interface LongAnswer extends BaseAnswerContent {
        type: 'long_answer';
        sampleAnswer?: string;
        keywords?: string[];
        rubric?: {
            criteria: string;
            points: number;
            description: string;
        }[];
    }
    interface TrueFalse extends BaseAnswerContent {
        type: 'true_false';
        isTrue: boolean;
    }
    interface Matching extends BaseAnswerContent {
        type: 'matching';
        correctMatches: {
            leftId: string;
            rightId: string;
        }[];
        allowsPartialCredit?: boolean;
    }
    interface FillBlank extends BaseAnswerContent {
        type: 'fill_blank';
        blanks: {
            id: string;
            acceptedAnswers: string[];
            caseSensitive?: boolean;
        }[];
        allowsPartialCredit?: boolean;
    }
    interface Ordering extends BaseAnswerContent {
        type: 'ordering';
        correctOrder: string[];
        allowsPartialCredit?: boolean;
    }
}
export type AnswerContentData = AnswerContent.MultipleChoice | AnswerContent.ShortAnswer | AnswerContent.LongAnswer | AnswerContent.TrueFalse | AnswerContent.Matching | AnswerContent.FillBlank | AnswerContent.Ordering;
interface AnswerContentProps {
    data: AnswerContentData;
}
export declare class AnswerContent extends ValueObject<AnswerContentProps> {
    private constructor();
    get data(): AnswerContentData;
    get type(): ProblemTypeValue;
    get explanation(): string | undefined;
    get points(): number;
    get allowsPartialCredit(): boolean;
    getCorrectAnswers(): any;
    getCaseSensitive(): boolean | undefined;
    getTrimWhitespace(): boolean | undefined;
    static create(data: AnswerContentData): Result<AnswerContent>;
    private static validateAnswerData;
    private static validatePoints;
    private static validateUniqueness;
    private static validateNonEmptyArray;
    private static validateMultipleChoice;
    private static validateShortAnswer;
    private static validateLongAnswer;
    private static validateTrueFalse;
    private static validateMatching;
    private static validateFillBlank;
    private static validateOrdering;
    toJSON(): {
        type: 'AnswerContent';
        data: AnswerContentData;
    };
    toPrimitive(): AnswerContentData;
    static fromJSON(json: {
        data: AnswerContentData;
    }): Result<AnswerContent>;
    static fromPrimitive(data: AnswerContentData): Result<AnswerContent>;
}
export {};
//# sourceMappingURL=AnswerContent.d.ts.map