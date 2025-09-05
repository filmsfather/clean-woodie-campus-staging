import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
interface StudentIdProps {
    value: string;
}
export declare class StudentId extends ValueObject<StudentIdProps> {
    get value(): string;
    private constructor();
    static create(value: string): Result<StudentId>;
    equals(other: StudentId): boolean;
    toString(): string;
}
export {};
//# sourceMappingURL=StudentId.d.ts.map