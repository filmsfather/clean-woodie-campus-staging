import { ValueObject } from '../../value-objects/ValueObject'
import { Result } from '../../common/Result'
import { Guard } from '../../common/Guard'
import { ReviewInterval } from './ReviewInterval'
import { EaseFactor } from './EaseFactor'

interface ReviewStateProps {
  interval: ReviewInterval
  easeFactor: EaseFactor
  reviewCount: number
  lastReviewedAt: Date | null
  nextReviewAt: Date
}

export class ReviewState extends ValueObject<ReviewStateProps> {
  get interval(): ReviewInterval {
    return this.props.interval
  }

  get easeFactor(): EaseFactor {
    return this.props.easeFactor
  }

  get reviewCount(): number {
    return this.props.reviewCount
  }

  get lastReviewedAt(): Date | null {
    return this.props.lastReviewedAt
  }

  get nextReviewAt(): Date {
    return this.props.nextReviewAt
  }

  private constructor(props: ReviewStateProps) {
    super(props)
  }

  public static create(props: {
    interval: ReviewInterval
    easeFactor: EaseFactor
    reviewCount: number
    lastReviewedAt: Date | null
    nextReviewAt: Date
  }): Result<ReviewState> {
    const { interval, easeFactor, reviewCount, lastReviewedAt, nextReviewAt } = props

    const nullOrUndefinedGuard = Guard.againstNullOrUndefined(interval, 'interval')
    if (nullOrUndefinedGuard.isFailure) {
      return Result.fail<ReviewState>(nullOrUndefinedGuard.error)
    }

    const easeFactorGuard = Guard.againstNullOrUndefined(easeFactor, 'easeFactor')
    if (easeFactorGuard.isFailure) {
      return Result.fail<ReviewState>(easeFactorGuard.error)
    }

    const reviewCountGuard = Guard.againstNullOrUndefined(reviewCount, 'reviewCount')
    if (reviewCountGuard.isFailure) {
      return Result.fail<ReviewState>(reviewCountGuard.error)
    }

    const reviewCountRangeGuard = Guard.againstAtLeast(reviewCount, 0, 'reviewCount')
    if (reviewCountRangeGuard.isFailure) {
      return Result.fail<ReviewState>(reviewCountRangeGuard.error)
    }

    const nextReviewGuard = Guard.againstNullOrUndefined(nextReviewAt, 'nextReviewAt')
    if (nextReviewGuard.isFailure) {
      return Result.fail<ReviewState>(nextReviewGuard.error)
    }

    return Result.ok<ReviewState>(new ReviewState({
      interval,
      easeFactor,
      reviewCount,
      lastReviewedAt,
      nextReviewAt
    }))
  }

  public static initial(nextReviewAt: Date): ReviewState {
    return new ReviewState({
      interval: ReviewInterval.initial(),
      easeFactor: EaseFactor.default(),
      reviewCount: 0,
      lastReviewedAt: null,
      nextReviewAt
    })
  }

  public withNewReview(
    newInterval: ReviewInterval,
    newEaseFactor: EaseFactor,
    reviewedAt: Date
  ): ReviewState {
    const nextReviewAt = newInterval.calculateNextReviewDate(reviewedAt)
    
    return new ReviewState({
      interval: newInterval,
      easeFactor: newEaseFactor,
      reviewCount: this.reviewCount + 1,
      lastReviewedAt: reviewedAt,
      nextReviewAt
    })
  }

  public isDue(currentDate: Date = new Date()): boolean {
    return currentDate.getTime() >= this.nextReviewAt.getTime()
  }

  public isFirstReview(): boolean {
    return this.reviewCount === 0
  }

  public daysSinceLastReview(currentDate: Date = new Date()): number {
    if (!this.lastReviewedAt) return 0
    const diffMs = currentDate.getTime() - this.lastReviewedAt.getTime()
    return Math.floor(diffMs / (1000 * 60 * 60 * 24))
  }

  /**
   * 복습 기한이 초과되었는지 확인
   */
  public isOverdue(currentDate: Date = new Date()): boolean {
    return currentDate.getTime() > this.nextReviewAt.getTime()
  }

  /**
   * 복습까지 남은 시간 (분 단위)
   */
  public minutesUntilDue(currentDate: Date = new Date()): number {
    const diffMs = this.nextReviewAt.getTime() - currentDate.getTime()
    return Math.floor(diffMs / (1000 * 60))
  }

  /**
   * 새로운 복습 시간으로 상태 생성
   */
  public withNewReviewTime(newReviewTime: Date): ReviewState {
    return new ReviewState({
      interval: this.interval,
      easeFactor: this.easeFactor,
      reviewCount: this.reviewCount,
      lastReviewedAt: this.lastReviewedAt,
      nextReviewAt: newReviewTime
    })
  }

  /**
   * 새로운 간격으로 상태 생성
   */
  public withNewInterval(intervalDays: number): ReviewState {
    const newInterval = ReviewInterval.create(intervalDays)
    if (newInterval.isSuccess) {
      const nextReviewAt = this.lastReviewedAt 
        ? newInterval.value.calculateNextReviewDate(this.lastReviewedAt)
        : this.nextReviewAt
      
      return new ReviewState({
        interval: newInterval.value,
        easeFactor: this.easeFactor,
        reviewCount: this.reviewCount,
        lastReviewedAt: this.lastReviewedAt,
        nextReviewAt
      })
    }
    return this // 실패 시 현재 상태 반환
  }

  /**
   * 새로운 Ease Factor로 상태 생성
   */
  public withNewEaseFactor(newEaseFactor: EaseFactor): ReviewState {
    return new ReviewState({
      interval: this.interval,
      easeFactor: newEaseFactor,
      reviewCount: this.reviewCount,
      lastReviewedAt: this.lastReviewedAt,
      nextReviewAt: this.nextReviewAt
    })
  }
}