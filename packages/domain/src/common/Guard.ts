import { Result } from './Result'

export interface GuardArgument {
  argument: any
  argumentName: string
}

export type GuardArgumentCollection = GuardArgument[]

export class Guard {
  public static combine(guardResults: Result<any>[]): Result<any> {
    return Result.combine(guardResults)
  }

  public static againstNullOrUndefined(argument: any, argumentName: string): Result<any> {
    if (argument === null || argument === undefined) {
      return Result.fail(`${argumentName} is null or undefined`)
    } else {
      return Result.ok()
    }
  }

  public static againstNullOrUndefinedBulk(args: GuardArgumentCollection): Result<any> {
    for (const arg of args) {
      const result = this.againstNullOrUndefined(arg.argument, arg.argumentName)
      if (result.isFailure) return result
    }

    return Result.ok()
  }

  public static isOneOf(value: any, validValues: any[], argumentName: string): Result<any> {
    let isValid = false
    for (const validValue of validValues) {
      if (value === validValue) {
        isValid = true
      }
    }

    if (isValid) {
      return Result.ok()
    } else {
      return Result.fail(
        `${argumentName} isn't oneOf the correct types in ${JSON.stringify(
          validValues,
        )}. Got "${value}".`,
      )
    }
  }

  public static inRange(num: number, min: number, max: number, argumentName: string): Result<any> {
    const isInRange = num >= min && num <= max
    if (!isInRange) {
      return Result.fail(`${argumentName} is not within range ${min} to ${max}.`)
    } else {
      return Result.ok()
    }
  }

  public static allInRange(
    numbers: number[],
    min: number,
    max: number,
    argumentName: string,
  ): Result<any> {
    let failingResult: Result<any> | null = null

    for (const num of numbers) {
      const numIsInRangeResult = this.inRange(num, min, max, argumentName)
      if (numIsInRangeResult.isFailure) failingResult = numIsInRangeResult
    }

    if (failingResult) {
      return Result.fail(`${argumentName} is not within the range.`)
    } else {
      return Result.ok()
    }
  }

  public static againstEmptyString(value: string, argumentName: string): Result<any> {
    if (value === '') {
      return Result.fail(`${argumentName} is empty`)
    } else {
      return Result.ok()
    }
  }

  public static againstEmptyStringBulk(args: GuardArgument[]): Result<any> {
    for (const arg of args) {
      const result = this.againstEmptyString(arg.argument, arg.argumentName)
      if (result.isFailure) return result
    }

    return Result.ok()
  }

  public static againstAtLeast(num: number, min: number, argumentName: string): Result<any> {
    const isAtLeast = num >= min
    if (!isAtLeast) {
      return Result.fail(`${argumentName} must be at least ${min}.`)
    } else {
      return Result.ok()
    }
  }
}