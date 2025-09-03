export declare class Identifier<T> {
    private value;
    constructor(value: T);
    equals(id?: Identifier<T>): boolean;
    toString(): string;
    toValue(): T;
}
export declare class UniqueEntityID extends Identifier<string | number> {
    constructor(id?: string | number);
    private static generateId;
}
//# sourceMappingURL=Identifier.d.ts.map