export declare abstract class ValueObject<T> {
    protected readonly props: T;
    constructor(props: T);
    equals(valueObject: ValueObject<T>): boolean;
    private shallowEqual;
    toString(): string;
}
//# sourceMappingURL=ValueObject.d.ts.map