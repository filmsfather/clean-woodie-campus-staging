import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
interface ProblemSetTitleProps {
    value: string;
}
export declare class ProblemSetTitle extends ValueObject<ProblemSetTitleProps> {
    get value(): string;
    private constructor();
    static create(title: string): Result<ProblemSetTitle>;
}
export {};
//# sourceMappingURL=ProblemSetTitle.d.ts.map