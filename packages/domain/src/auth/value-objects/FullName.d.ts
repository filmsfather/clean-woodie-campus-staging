import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
export interface FullNameProps {
    value: string;
}
export declare class FullName extends ValueObject<FullNameProps> {
    private constructor();
    get value(): string;
    static create(name: string): Result<FullName>;
    getDisplayName(): string;
    getInitials(): string;
}
//# sourceMappingURL=FullName.d.ts.map