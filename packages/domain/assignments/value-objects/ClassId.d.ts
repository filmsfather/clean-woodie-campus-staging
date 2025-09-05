import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
interface ClassIdProps {
    value: string;
}
export declare class ClassId extends ValueObject<ClassIdProps> {
    get value(): string;
    private constructor();
    static create(value: string): Result<ClassId>;
    equals(other: ClassId): boolean;
    toString(): string;
}
export {};
//# sourceMappingURL=ClassId.d.ts.map