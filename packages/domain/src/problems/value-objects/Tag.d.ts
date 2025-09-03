import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
interface TagProps {
    name: string;
}
export declare class Tag extends ValueObject<TagProps> {
    private constructor();
    get name(): string;
    static create(name: string): Result<Tag>;
    static normalize(name: string): string;
    static createMany(names: string[]): Result<Tag[]>;
    static removeDuplicates(tags: Tag[]): Tag[];
    toJSON(): {
        type: 'Tag';
        name: string;
    };
    toString(): string;
    toPrimitive(): string;
    static fromJSON(json: {
        name: string;
    }): Result<Tag>;
    static fromString(value: string): Result<Tag>;
    static fromPrimitive(name: string): Result<Tag>;
    static toStringArray(tags: Tag[]): string[];
    static fromStringArray(names: string[]): Result<Tag[]>;
}
export {};
//# sourceMappingURL=Tag.d.ts.map