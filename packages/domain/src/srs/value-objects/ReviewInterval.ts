import { ValueObject } from '../../value-objects/ValueObject'
import { Result } from '../../common/Result'
import { Guard } from '../../common/Guard'
import { SrsPolicy } from '../services/SrsPolicy'

interface ReviewIntervalProps {
  days: number
}

export class ReviewInterval extends ValueObject<ReviewIntervalProps> {
  public static readonly MIN_INTERVAL_DAYS = SrsPolicy.MIN_INTERVAL_DAYS
  public static readonly INITIAL_INTERVAL_DAYS = SrsPolicy.INITIAL_INTERVAL_DAYS
  public static readonly MAX_INTERVAL_DAYS = SrsPolicy.MAX_INTERVAL_DAYS

  get days(): number {
    return this.props.days
  }

  // 편의 메서드들
  get hours(): number {
    return this.days * 24
  }

  get minutes(): number {
    return this.hours * 60
  }

  private constructor(props: ReviewIntervalProps) {
    super(props)
  }

  public static create(days: number): Result<ReviewInterval> {
    const nullOrUndefinedGuard = Guard.againstNullOrUndefined(days, 'days')
    if (nullOrUndefinedGuard.isFailure) {
      return Result.fail<ReviewInterval>(nullOrUndefinedGuard.error)
    }

    const rangeGuard = Guard.inRange(days, this.MIN_INTERVAL_DAYS, this.MAX_INTERVAL_DAYS, 'days')
    if (rangeGuard.isFailure) {
      return Result.fail<ReviewInterval>(rangeGuard.error)
    }

    return Result.ok<ReviewInterval>(new ReviewInterval({ days }))
  }

  public static initial(): ReviewInterval {
    return new ReviewInterval({ days: this.INITIAL_INTERVAL_DAYS })
  }

  public static fromHours(hours: number): Result<ReviewInterval> {
    return this.create(Math.ceil(hours / 24))
  }

  public static fromMinutes(minutes: number): Result<ReviewInterval> {
    return this.create(Math.ceil(minutes / (24 * 60)))
  }

  public static immediate(): ReviewInterval {
    // 5분 후 재복습 - 최소 단위인 1일로 설정
    return new ReviewInterval({ days: 1 })
  }

  public static fromDays(days: number): ReviewInterval {
    const result = this.create(days)
    if (result.isFailure) {
      throw new Error(result.error)
    }
    return result.value
  }

  /**
   * 간격에 배수 적용
   */
  public multiplyBy(multiplier: number): Result<ReviewInterval> {
    const newDays = Math.max(1, Math.round(this.days * multiplier))
    return ReviewInterval.create(newDays)
  }

  /**
   * 간격 증가
   */
  public addDays(additionalDays: number): Result<ReviewInterval> {
    return ReviewInterval.create(this.days + additionalDays)
  }

  /**
   * 최소 간격으로 설정
   */
  public min(other: ReviewInterval): ReviewInterval {
    return this.days <= other.days ? this : other
  }

  /**
   * 최대 간격으로 설정
   */
  public max(other: ReviewInterval): ReviewInterval {
    return this.days >= other.days ? this : other
  }

  /**
   * 특정 날짜에서 다음 리뷰 날짜 계산
   */
  public getNextReviewDate(fromDate: Date): Date {
    const nextDate = new Date(fromDate)
    nextDate.setDate(nextDate.getDate() + this.days)
    return nextDate
  }

  /**
   * SpacedRepetitionCalculator와의 호환성을 위한 별칭
   */
  public calculateNextReviewDate(fromDate: Date): Date {
    return this.getNextReviewDate(fromDate)
  }

  /**
   * 간격 수준 평가
   */
  public getIntervalLevel(): 'short' | 'medium' | 'long' {
    if (this.days <= 3) return 'short'
    if (this.days <= 30) return 'medium'
    return 'long'
  }

  /**
   * 두 간격 사이의 비율
   */
  public ratioTo(other: ReviewInterval): number {
    return this.days / other.days
  }
}