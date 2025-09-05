import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
import { ProblemType, ProblemTypeValue } from './ProblemType';
export interface BaseProblemContent {
    type: ProblemTypeValue;
    title: string;
    description?: string;
    instructions?: string;
    attachments?: string[];
}
export interface MultipleChoiceContent extends BaseProblemContent {
    type: 'multiple_choice';
    choices: {
        id: string;
        text: string;
        explanation?: string;
    }[];
    allowMultiple?: boolean;
}
export interface ShortAnswerContent extends BaseProblemContent {
    type: 'short_answer';
    placeholder?: string;
    maxLength?: number;
    caseSensitive?: boolean;
}
export interface LongAnswerContent extends BaseProblemContent {
    type: 'long_answer';
    placeholder?: string;
    minLength?: number;
    maxLength?: number;
    rubric?: {
        criteria: string;
        description: string;
        points: number;
    }[];
}
export interface TrueFalseContent extends BaseProblemContent {
    type: 'true_false';
    statement: string;
}
export interface MatchingContent extends BaseProblemContent {
    type: 'matching';
    leftItems: {
        id: string;
        text: string;
    }[];
    rightItems: {
        id: string;
        text: string;
    }[];
}
export interface FillBlankContent extends BaseProblemContent {
    type: 'fill_blank';
    text: string;
    blanks: {
        id: string;
        placeholder?: string;
        maxLength?: number;
    }[];
}
export interface OrderingContent extends BaseProblemContent {
    type: 'ordering';
    items: {
        id: string;
        text: string;
    }[];
    instructions?: string;
}
export type ProblemContentData = MultipleChoiceContent | ShortAnswerContent | LongAnswerContent | TrueFalseContent | MatchingContent | FillBlankContent | OrderingContent;
interface ProblemContentProps {
    data: ProblemContentData;
}
export declare class ProblemContent extends ValueObject<ProblemContentProps> {
    private constructor();
    get data(): ProblemContentData;
    get type(): ProblemType;
    get title(): string;
    get description(): string | undefined;
    get instructions(): string | undefined;
    get attachments(): string[];
    static create(data: ProblemContentData): Result<ProblemContent>;
    private static validateContent;
    private static validateMultipleChoice;
    private static validateShortAnswer;
    private static validateLongAnswer;
    private static validateTrueFalse;
    private static validateMatching;
    private static validateFillBlank;
    private static validateOrdering;
    toJSON(): {
        type: 'ProblemContent';
        data: ProblemContentData;
    };
    toPrimitive(): ProblemContentData;
    static fromJSON(json: {
        data: ProblemContentData;
    }): Result<ProblemContent>;
    static fromPrimitive(data: ProblemContentData): Result<ProblemContent>;
    updateTitle(title: string): Result<ProblemContent>;
    updateDescription(description: string): Result<ProblemContent>;
}
export {};
//# sourceMappingURL=ProblemContent.d.ts.map