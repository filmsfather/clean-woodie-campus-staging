export class Result<T> {
  private constructor(
    private readonly _isSuccess: boolean,
    private readonly _error?: string,
    private readonly _value?: T,
  ) {
    if (this._isSuccess && this._error) {
      throw new Error('InvalidOperation: A result cannot be successful and contain an error')
    }
    if (!this._isSuccess && !this._error) {
      throw new Error('InvalidOperation: A failing result needs to contain an error message')
    }
  }

  get isSuccess(): boolean {
    return this._isSuccess
  }

  get isFailure(): boolean {
    return !this._isSuccess
  }

  get error(): string {
    return this._error || ''
  }

  get value(): T {
    if (!this._isSuccess) {
      throw new Error(`Can't get the value of an error result. Use 'errorValue' instead.`)
    }

    return this._value!
  }

  get errorValue(): string {
    return this._error || ''
  }

  getValue(): T {
    return this.value
  }

  getErrorValue(): string {
    return this.errorValue
  }

  static ok<U>(value?: U): Result<U> {
    return new Result<U>(true, undefined, value)
  }

  static fail<U>(error: string): Result<U> {
    return new Result<U>(false, error)
  }

  static combine(results: Result<any>[]): Result<any> {
    for (const result of results) {
      if (result.isFailure) return result
    }
    return Result.ok()
  }
}