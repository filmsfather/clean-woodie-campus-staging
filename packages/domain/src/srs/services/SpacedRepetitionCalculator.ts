import { ReviewFeedback } from '../value-objects/ReviewFeedback'
import { ReviewInterval } from '../value-objects/ReviewInterval'
import { EaseFactor } from '../value-objects/EaseFactor'
import { ReviewState } from '../value-objects/ReviewState'
import { Result } from '../../common/Result'
import { ISpacedRepetitionPolicy, ReviewCalculationResult } from './ISpacedRepetitionPolicy'
import { SrsPolicy } from './SrsPolicy'

export class SpacedRepetitionCalculator implements ISpacedRepetitionPolicy {
  /**
   * 에빙하우스 망각곡선 기반 간격 반복 알고리즘
   * 
   * 피드백별 처리:
   * - AGAIN: 즉시 재복습 (5분 후), 난이도 계수 감소
   * - HARD: 간격 축소 (현재 간격 × 1.2), 난이도 계수 약간 감소  
   * - GOOD: 정상 진행 (현재 간격 × 난이도 계수)
   * - EASY: 간격 확대 (현재 간격 × 난이도 계수 × 1.3), 난이도 계수 증가
   */
  public calculateNextInterval(
    currentState: ReviewState,
    feedback: ReviewFeedback
  ): ReviewCalculationResult {
    const currentInterval = currentState.interval
    const currentEaseFactor = currentState.easeFactor

    let newInterval: ReviewInterval
    let newEaseFactor: EaseFactor

    if (feedback.isAgain()) {
      // AGAIN: 즉시 재복습, 난이도 계수 감소
      newInterval = ReviewInterval.immediate()
      newEaseFactor = currentEaseFactor.adjustForFeedback(feedback)
      
    } else if (feedback.isHard()) {
      // HARD: 간격 축소, 난이도 계수 약간 감소
      const intervalResult = currentInterval.multiplyBy(SrsPolicy.HARD_INTERVAL_MULTIPLIER)
      if (intervalResult.isFailure) {
        // 실패하면 최대 간격으로 설정
        newInterval = ReviewInterval.fromDays(SrsPolicy.MAX_INTERVAL_DAYS)
      } else {
        newInterval = intervalResult.value
      }
      newEaseFactor = currentEaseFactor.adjustForFeedback(feedback)
      
    } else if (feedback.isGood()) {
      // GOOD: 정상 진행
      const intervalResult = currentInterval.multiplyBy(currentEaseFactor.value)
      if (intervalResult.isFailure) {
        // 실패하면 최대 간격으로 설정
        newInterval = ReviewInterval.fromDays(SrsPolicy.MAX_INTERVAL_DAYS)
      } else {
        newInterval = intervalResult.value
      }
      newEaseFactor = currentEaseFactor // 변화 없음
      
    } else if (feedback.isEasy()) {
      // EASY: 간격 확대, 난이도 계수 증가
      const multiplier = currentEaseFactor.value * SrsPolicy.EASY_INTERVAL_BONUS_MULTIPLIER
      const intervalResult = currentInterval.multiplyBy(multiplier)
      if (intervalResult.isFailure) {
        // 실패하면 최대 간격으로 설정
        newInterval = ReviewInterval.fromDays(SrsPolicy.MAX_INTERVAL_DAYS)
      } else {
        newInterval = intervalResult.value
      }
      newEaseFactor = currentEaseFactor.adjustForFeedback(feedback)
      
    } else {
      throw new Error('Invalid feedback type')
    }

    // 최대 간격 제한 적용
    if (newInterval.days > SrsPolicy.MAX_INTERVAL_DAYS) {
      newInterval = ReviewInterval.fromDays(SrsPolicy.MAX_INTERVAL_DAYS)
    }

    return {
      newInterval,
      newEaseFactor
    }
  }

  /**
   * 새로운 문제 학습 시 초기 복습 상태 생성
   */
  public createInitialState(baseDate: Date): ReviewState {
    const nextReviewAt = ReviewInterval.initial().calculateNextReviewDate(baseDate)
    return ReviewState.initial(nextReviewAt)
  }

  /**
   * 연속 실패 시 간격 리셋 로직
   */
  public shouldResetInterval(
    currentState: ReviewState, 
    consecutiveFailures: number
  ): boolean {
    // 정책에 정의된 연속 실패 횟수에 도달하면 간격을 초기값으로 리셋
    return consecutiveFailures >= SrsPolicy.RESET_THRESHOLD_FAILURES && currentState.reviewCount > 0
  }

  /**
   * 장기 미복습 시 간격 조정
   */
  public adjustForLateReview(
    currentState: ReviewState,
    currentDate: Date
  ): ReviewCalculationResult {
    const daysLate = currentState.daysSinceLastReview(currentDate) - currentState.interval.days

    if (daysLate <= 0) {
      // 제시간에 복습한 경우
      return {
        newInterval: currentState.interval,
        newEaseFactor: currentState.easeFactor
      }
    }

    // 늦은 복습 시 난이도 계수 약간 감소
    const penaltyFactor = Math.min(0.15, daysLate * 0.02) // 최대 15% 감소
    const adjustedEaseFactorValue = Math.max(
      EaseFactor.MIN_EASE_FACTOR,
      currentState.easeFactor.value - penaltyFactor
    )

    const adjustedEaseFactorResult = EaseFactor.create(adjustedEaseFactorValue)
    if (adjustedEaseFactorResult.isFailure) {
      throw new Error(`Invalid ease factor: ${adjustedEaseFactorResult.error}`)
    }

    return {
      newInterval: currentState.interval,
      newEaseFactor: adjustedEaseFactorResult.value
    }
  }
}