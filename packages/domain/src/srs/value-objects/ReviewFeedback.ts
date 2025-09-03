import { ValueObject } from '../../value-objects/ValueObject'
import { Result } from '../../common/Result'
import { Guard } from '../../common/Guard'

interface ReviewFeedbackProps {
  value: ReviewFeedbackType
}

export type ReviewFeedbackType = 'AGAIN' | 'HARD' | 'GOOD' | 'EASY'

export class ReviewFeedback extends ValueObject<ReviewFeedbackProps> {
  public static readonly AGAIN = 'AGAIN' as const
  public static readonly HARD = 'HARD' as const
  public static readonly GOOD = 'GOOD' as const
  public static readonly EASY = 'EASY' as const

  get value(): ReviewFeedbackType {
    return this.props.value
  }

  private constructor(props: ReviewFeedbackProps) {
    super(props)
  }

  public static create(value: ReviewFeedbackType): Result<ReviewFeedback> {
    const nullOrUndefinedGuard = Guard.againstNullOrUndefined(value, 'value')
    if (nullOrUndefinedGuard.isFailure) {
      return Result.fail<ReviewFeedback>(nullOrUndefinedGuard.error)
    }

    const validValues: ReviewFeedbackType[] = ['AGAIN', 'HARD', 'GOOD', 'EASY']
    const validValueGuard = Guard.isOneOf(value, validValues, 'value')
    if (validValueGuard.isFailure) {
      return Result.fail<ReviewFeedback>(validValueGuard.error)
    }

    return Result.ok<ReviewFeedback>(new ReviewFeedback({ value }))
  }

  public static again(): ReviewFeedback {
    return new ReviewFeedback({ value: this.AGAIN })
  }

  public static hard(): ReviewFeedback {
    return new ReviewFeedback({ value: this.HARD })
  }

  public static good(): ReviewFeedback {
    return new ReviewFeedback({ value: this.GOOD })
  }

  public static easy(): ReviewFeedback {
    return new ReviewFeedback({ value: this.EASY })
  }

  public isAgain(): boolean {
    return this.value === ReviewFeedback.AGAIN
  }

  public isHard(): boolean {
    return this.value === ReviewFeedback.HARD
  }

  public isGood(): boolean {
    return this.value === ReviewFeedback.GOOD
  }

  public isEasy(): boolean {
    return this.value === ReviewFeedback.EASY
  }
}