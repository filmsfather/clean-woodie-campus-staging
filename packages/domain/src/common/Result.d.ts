export declare class Result<T> {
    private readonly _isSuccess;
    private readonly _error?;
    private readonly _value?;
    private constructor();
    get isSuccess(): boolean;
    get isFailure(): boolean;
    get error(): string;
    get value(): T;
    get errorValue(): string;
    getValue(): T;
    getErrorValue(): string;
    static ok<U>(value?: U): Result<U>;
    static fail<U>(error: string): Result<U>;
    static combine(results: Result<any>[]): Result<any>;
}
//# sourceMappingURL=Result.d.ts.map