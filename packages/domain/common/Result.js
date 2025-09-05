export class Result {
    _isSuccess;
    _error;
    _value;
    constructor(_isSuccess, _error, _value) {
        this._isSuccess = _isSuccess;
        this._error = _error;
        this._value = _value;
        if (this._isSuccess && this._error) {
            throw new Error('InvalidOperation: A result cannot be successful and contain an error');
        }
        if (!this._isSuccess && !this._error) {
            throw new Error('InvalidOperation: A failing result needs to contain an error message');
        }
    }
    get isSuccess() {
        return this._isSuccess;
    }
    get isFailure() {
        return !this._isSuccess;
    }
    get error() {
        return this._error || '';
    }
    get value() {
        if (!this._isSuccess) {
            throw new Error(`Can't get the value of an error result. Use 'errorValue' instead.`);
        }
        return this._value;
    }
    get errorValue() {
        return this._error || '';
    }
    getValue() {
        return this.value;
    }
    getErrorValue() {
        return this.errorValue;
    }
    static ok(value) {
        return new Result(true, undefined, value);
    }
    static fail(error) {
        return new Result(false, error);
    }
    static combine(results) {
        for (const result of results) {
            if (result.isFailure)
                return result;
        }
        return Result.ok();
    }
}
//# sourceMappingURL=Result.js.map