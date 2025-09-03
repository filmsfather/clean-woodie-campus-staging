import { SpacedRepetitionCalculator } from '../../srs/services/SpacedRepetitionCalculator'
import { ReviewState } from '../../srs/value-objects/ReviewState'
import { ReviewInterval } from '../../srs/value-objects/ReviewInterval'
import { EaseFactor } from '../../srs/value-objects/EaseFactor'
import { ReviewFeedback } from '../../srs/value-objects/ReviewFeedback'

describe('SpacedRepetitionCalculator', () => {
  let calculator: SpacedRepetitionCalculator

  beforeEach(() => {
    calculator = new SpacedRepetitionCalculator()
  })

  describe('calculateNextInterval', () => {
    test('AGAIN 피드백 시 간격이 리셋되어야 함', () => {
      // Arrange
      const reviewState = ReviewState.create({
        interval: ReviewInterval.fromDays(7),
        easeFactor: EaseFactor.create(2.5).value,
        reviewCount: 3,
        lastReviewedAt: new Date('2024-01-01'),
        nextReviewAt: new Date('2024-01-08')
      }).value

      const feedback = ReviewFeedback.create('AGAIN').value

      // Act
      const result = calculator.calculateNextInterval(reviewState, feedback)

      // Assert
      expect(result.newInterval.days).toBeLessThan(reviewState.interval.days)
      expect(result.newEaseFactor.value).toBeLessThan(reviewState.easeFactor.value)
      expect(result.newEaseFactor.value).toBeGreaterThanOrEqual(1.3) // 최소값 확인
    })

    test('EASY 피드백 시 간격과 ease factor가 증가해야 함', () => {
      // Arrange
      const reviewState = ReviewState.create({
        interval: ReviewInterval.fromDays(7),
        easeFactor: EaseFactor.create(2.5).value,
        reviewCount: 3,
        lastReviewedAt: new Date('2024-01-01'),
        nextReviewAt: new Date('2024-01-08')
      }).value

      const feedback = ReviewFeedback.create('EASY').value

      // Act
      const result = calculator.calculateNextInterval(reviewState, feedback)

      // Assert
      expect(result.newInterval.days).toBeGreaterThan(reviewState.interval.days)
      expect(result.newEaseFactor.value).toBeGreaterThanOrEqual(reviewState.easeFactor.value)
      expect(result.newEaseFactor.value).toBeLessThanOrEqual(4.0) // 최대값 확인
    })

    test('연속된 복습에서 간격이 지수적으로 증가해야 함', () => {
      let currentState = ReviewState.create({
        interval: ReviewInterval.fromDays(1),
        easeFactor: EaseFactor.create(2.5).value,
        reviewCount: 0,
        lastReviewedAt: new Date('2024-01-01'),
        nextReviewAt: new Date('2024-01-02')
      }).value

      const goodFeedback = ReviewFeedback.create('GOOD').value
      const intervals: number[] = []

      // 5번의 성공적인 복습 시뮬레이션
      for (let i = 0; i < 5; i++) {
        const result = calculator.calculateNextInterval(currentState, goodFeedback)
        intervals.push(result.newInterval.days)
        
        currentState = ReviewState.create({
          interval: result.newInterval,
          easeFactor: result.newEaseFactor,
          reviewCount: currentState.reviewCount + 1,
          lastReviewedAt: new Date(),
          nextReviewAt: new Date(Date.now() + result.newInterval.days * 24 * 60 * 60 * 1000)
        }).value
      }

      // Assert: 간격이 증가하거나 최대값에 도달해야 함
      for (let i = 1; i < intervals.length; i++) {
        expect(intervals[i]).toBeGreaterThanOrEqual(intervals[i - 1])
      }

      // 마지막 간격이 충분히 커야 함 (최소 10일 이상이거나 최대값)
      expect(intervals[intervals.length - 1]).toBeGreaterThanOrEqual(10)
    })

    test('HARD 피드백은 간격을 적당히 줄여야 함', () => {
      // Arrange
      const reviewState = ReviewState.create({
        interval: ReviewInterval.fromDays(10),
        easeFactor: EaseFactor.create(2.5).value,
        reviewCount: 5,
        lastReviewedAt: new Date('2024-01-01'),
        nextReviewAt: new Date('2024-01-11')
      }).value

      const hardFeedback = ReviewFeedback.create('HARD').value

      // Act
      const result = calculator.calculateNextInterval(reviewState, hardFeedback)

      // Assert
      expect(result.newInterval.days).toBeLessThan(reviewState.interval.days)
      expect(result.newEaseFactor.value).toBeLessThan(reviewState.easeFactor.value)
      // HARD는 AGAIN보다는 덜 엄격해야 함
      expect(result.newInterval.days).toBeGreaterThan(1)
    })
  })

  describe('adjustForLateReview', () => {
    test('늦은 복습에 대한 패널티가 적용되어야 함', () => {
      // Arrange: 3일 늦은 복습
      const reviewState = ReviewState.create({
        interval: ReviewInterval.fromDays(7),
        easeFactor: EaseFactor.create(2.5).value,
        reviewCount: 3,
        lastReviewedAt: new Date('2024-01-01'),
        nextReviewAt: new Date('2024-01-08') // 예정일
      }).value

      const actualReviewDate = new Date('2024-01-11') // 3일 늦음

      // Act
      const result = calculator.adjustForLateReview(reviewState, actualReviewDate)

      // Assert
      expect(result.newEaseFactor.value).toBeLessThan(reviewState.easeFactor.value)
      expect(result.newInterval.days).toBeLessThanOrEqual(reviewState.interval.days)
    })

    test('일찍 복습한 경우 패널티가 없어야 함', () => {
      // Arrange: 1일 일찍 복습
      const reviewState = ReviewState.create({
        interval: ReviewInterval.fromDays(7),
        easeFactor: EaseFactor.create(2.5).value,
        reviewCount: 3,
        lastReviewedAt: new Date('2024-01-01'),
        nextReviewAt: new Date('2024-01-08') // 예정일
      }).value

      const actualReviewDate = new Date('2024-01-07') // 1일 일찍

      // Act
      const result = calculator.adjustForLateReview(reviewState, actualReviewDate)

      // Assert: 패널티 없음
      expect(result.newEaseFactor.value).toBe(reviewState.easeFactor.value)
      expect(result.newInterval.days).toBe(reviewState.interval.days)
    })
  })

  describe('shouldResetInterval', () => {
    test('연속 실패 횟수가 3회 이상이면 간격을 리셋해야 함', () => {
      // Arrange
      const reviewState = ReviewState.create({
        interval: ReviewInterval.fromDays(30),
        easeFactor: EaseFactor.create(2.5).value,
        reviewCount: 10,
        lastReviewedAt: new Date('2024-01-01'),
        nextReviewAt: new Date('2024-01-31')
      }).value

      const consecutiveFailures = 3

      // Act
      const shouldReset = calculator.shouldResetInterval(reviewState, consecutiveFailures)

      // Assert
      expect(shouldReset).toBe(true)
    })

    test('연속 실패 횟수가 2회 이하면 간격을 유지해야 함', () => {
      // Arrange
      const reviewState = ReviewState.create({
        interval: ReviewInterval.fromDays(30),
        easeFactor: EaseFactor.create(2.5).value,
        reviewCount: 10,
        lastReviewedAt: new Date('2024-01-01'),
        nextReviewAt: new Date('2024-01-31')
      }).value

      const consecutiveFailures = 2

      // Act
      const shouldReset = calculator.shouldResetInterval(reviewState, consecutiveFailures)

      // Assert
      expect(shouldReset).toBe(false)
    })
  })

  describe('경계값 테스트', () => {
    test('최소 간격 (1일)이 유지되어야 함', () => {
      // Arrange: 매우 낮은 ease factor와 짧은 간격
      const reviewState = ReviewState.create({
        interval: ReviewInterval.fromDays(1),
        easeFactor: EaseFactor.create(1.3).value,
        reviewCount: 1,
        lastReviewedAt: new Date('2024-01-01'),
        nextReviewAt: new Date('2024-01-02')
      }).value

      const againFeedback = ReviewFeedback.create('AGAIN').value

      // Act
      const result = calculator.calculateNextInterval(reviewState, againFeedback)

      // Assert
      expect(result.newInterval.days).toBeGreaterThanOrEqual(1)
    })

    test('최대 간격 제한이 적용되어야 함', () => {
      // Arrange: 매우 높은 ease factor
      let currentState = ReviewState.create({
        interval: ReviewInterval.fromDays(20),
        easeFactor: EaseFactor.create(4.0).value,
        reviewCount: 10,
        lastReviewedAt: new Date('2024-01-01'),
        nextReviewAt: new Date('2024-04-10')
      }).value

      const easyFeedback = ReviewFeedback.create('EASY').value

      // Act: 여러 번 EASY 피드백
      for (let i = 0; i < 5; i++) {
        const result = calculator.calculateNextInterval(currentState, easyFeedback)
        currentState = ReviewState.create({
          interval: result.newInterval,
          easeFactor: result.newEaseFactor,
          reviewCount: currentState.reviewCount + 1,
          lastReviewedAt: new Date(),
          nextReviewAt: new Date(Date.now() + result.newInterval.days * 24 * 60 * 60 * 1000)
        }).value
      }

      // Assert: 최대 간격 제한 (예: 30일)
      expect(currentState.interval.days).toBeLessThanOrEqual(30)
    })
  })
})