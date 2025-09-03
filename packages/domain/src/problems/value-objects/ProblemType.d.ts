import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
declare const PROBLEM_TYPES: {
    readonly MULTIPLE_CHOICE: "multiple_choice";
    readonly SHORT_ANSWER: "short_answer";
    readonly LONG_ANSWER: "long_answer";
    readonly TRUE_FALSE: "true_false";
    readonly MATCHING: "matching";
    readonly FILL_BLANK: "fill_blank";
    readonly ORDERING: "ordering";
};
export type ProblemTypeValue = typeof PROBLEM_TYPES[keyof typeof PROBLEM_TYPES];
interface ProblemTypeProps {
    value: ProblemTypeValue;
}
export declare class ProblemType extends ValueObject<ProblemTypeProps> {
    private constructor();
    get value(): ProblemTypeValue;
    static isProblemType(value: string): value is ProblemTypeValue;
    static create(value: string): Result<ProblemType>;
    private static createUnsafe;
    static multipleChoice(): ProblemType;
    static shortAnswer(): ProblemType;
    static longAnswer(): ProblemType;
    static trueFalse(): ProblemType;
    static matching(): ProblemType;
    static fillBlank(): ProblemType;
    static ordering(): ProblemType;
    toJSON(): {
        type: 'ProblemType';
        value: ProblemTypeValue;
    };
    toString(): string;
    toPrimitive(): ProblemTypeValue;
    static fromJSON(json: {
        value: ProblemTypeValue;
    }): Result<ProblemType>;
    static fromString(value: string): Result<ProblemType>;
    static fromPrimitive(value: ProblemTypeValue): Result<ProblemType>;
    static readonly TYPES: {
        readonly MULTIPLE_CHOICE: "multiple_choice";
        readonly SHORT_ANSWER: "short_answer";
        readonly LONG_ANSWER: "long_answer";
        readonly TRUE_FALSE: "true_false";
        readonly MATCHING: "matching";
        readonly FILL_BLANK: "fill_blank";
        readonly ORDERING: "ordering";
    };
}
export {};
//# sourceMappingURL=ProblemType.d.ts.map