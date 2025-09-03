import { ValueObject } from '../../value-objects/ValueObject'
import { Result } from '../../common/Result'
import { Guard } from '../../common/Guard'
import { ReviewFeedback } from './ReviewFeedback'
import { SrsPolicy } from '../services/SrsPolicy'

interface EaseFactorProps {
  value: number
}

export class EaseFactor extends ValueObject<EaseFactorProps> {
  public static readonly MIN_EASE_FACTOR = SrsPolicy.MIN_EASE_FACTOR
  public static readonly DEFAULT_EASE_FACTOR = SrsPolicy.DEFAULT_EASE_FACTOR
  public static readonly MAX_EASE_FACTOR = SrsPolicy.MAX_EASE_FACTOR

  get value(): number {
    return this.props.value
  }

  private constructor(props: EaseFactorProps) {
    super(props)
  }

  public static create(value: number): Result<EaseFactor> {
    const nullOrUndefinedGuard = Guard.againstNullOrUndefined(value, 'value')
    if (nullOrUndefinedGuard.isFailure) {
      return Result.fail<EaseFactor>(nullOrUndefinedGuard.error)
    }

    const rangeGuard = Guard.inRange(value, this.MIN_EASE_FACTOR, this.MAX_EASE_FACTOR, 'value')
    if (rangeGuard.isFailure) {
      return Result.fail<EaseFactor>(rangeGuard.error)
    }

    return Result.ok<EaseFactor>(new EaseFactor({ value }))
  }

  public static default(): EaseFactor {
    return new EaseFactor({ value: this.DEFAULT_EASE_FACTOR })
  }

  public static minimum(): EaseFactor {
    return new EaseFactor({ value: this.MIN_EASE_FACTOR })
  }

  public static maximum(): EaseFactor {
    return new EaseFactor({ value: this.MAX_EASE_FACTOR })
  }

  /**
   * 피드백에 따른 난이도 계수 조정
   * SM-2 알고리즘 기반
   */
  public adjustForFeedback(feedback: ReviewFeedback): EaseFactor {
    let newValue = this.value

    switch (feedback.value) {
      case 'AGAIN':
        newValue = Math.max(SrsPolicy.MIN_EASE_FACTOR, this.value - SrsPolicy.AGAIN_EASE_PENALTY)
        break
      case 'HARD':
        newValue = Math.max(SrsPolicy.MIN_EASE_FACTOR, this.value - SrsPolicy.HARD_EASE_PENALTY)
        break
      case 'GOOD':
        // 변화 없음
        break
      case 'EASY':
        newValue = Math.min(SrsPolicy.MAX_EASE_FACTOR, this.value + SrsPolicy.EASY_EASE_BONUS)
        break
    }

    return new EaseFactor({ value: newValue })
  }

  /**
   * 난이도 수준 평가
   */
  public getDifficultyLevel(): 'easy' | 'medium' | 'hard' {
    if (this.value >= SrsPolicy.BEGINNER_EASE_THRESHOLD) return 'easy'
    if (this.value >= SrsPolicy.INTERMEDIATE_EASE_THRESHOLD) return 'medium'
    return 'hard'
  }

  /**
   * 두 난이도 계수 간의 차이
   */
  public distanceFrom(other: EaseFactor): number {
    return Math.abs(this.value - other.value)
  }

  /**
   * 더 어려운 계수인지 확인
   */
  public isHarderThan(other: EaseFactor): boolean {
    return this.value < other.value
  }
}