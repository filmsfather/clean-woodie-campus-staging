import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
interface ProblemSetDescriptionProps {
    value: string;
}
export declare class ProblemSetDescription extends ValueObject<ProblemSetDescriptionProps> {
    get value(): string;
    private constructor();
    static create(description: string): Result<ProblemSetDescription>;
    static createEmpty(): ProblemSetDescription;
}
export {};
//# sourceMappingURL=ProblemSetDescription.d.ts.map