import { ReviewSchedule } from '../../srs/entities/ReviewSchedule'
import { ReviewState } from '../../srs/value-objects/ReviewState'
import { ReviewInterval } from '../../srs/value-objects/ReviewInterval'
import { EaseFactor } from '../../srs/value-objects/EaseFactor'
import { ReviewFeedback } from '../../srs/value-objects/ReviewFeedback'
import { UniqueEntityID } from '../../common/Identifier'
import { SpacedRepetitionCalculator } from '../../srs/services/SpacedRepetitionCalculator'
import { SystemClock } from '../../../infrastructure/src/services/SystemClock'

// Mock Clock for testing
class MockClock {
  private currentTime: Date

  constructor(initialTime: Date = new Date('2024-01-15T10:00:00Z')) {
    this.currentTime = initialTime
  }

  now(): Date {
    return this.currentTime
  }

  setTime(time: Date): void {
    this.currentTime = time
  }

  advance(hours: number): void {
    this.currentTime = new Date(this.currentTime.getTime() + hours * 60 * 60 * 1000)
  }
}

describe('ReviewSchedule Entity', () => {
  let mockClock: MockClock
  let calculator: SpacedRepetitionCalculator
  let reviewSchedule: ReviewSchedule

  beforeEach(() => {
    mockClock = new MockClock()
    calculator = new SpacedRepetitionCalculator()

    // 기본 ReviewSchedule 생성 (미래 시점의 다음 복습일 설정)
    const reviewState = ReviewState.create({
      interval: ReviewInterval.fromDays(7),
      easeFactor: EaseFactor.create(2.5).value,
      reviewCount: 3,
      lastReviewedAt: new Date('2024-01-08T10:00:00Z'),
      nextReviewAt: new Date('2024-01-22T10:00:00Z') // 현재 시점(1/15)보다 미래로 설정
    }).value

    reviewSchedule = ReviewSchedule.reconstitute({
      studentId: new UniqueEntityID('student-1'),
      problemId: new UniqueEntityID('problem-1'),
      reviewState,
      consecutiveFailures: 0,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-08')
    }, new UniqueEntityID('schedule-1'))
  })

  describe('processReviewFeedback', () => {
    test('성공적인 피드백 처리 시 상태가 업데이트되어야 함', () => {
      // Arrange
      const feedback = ReviewFeedback.create('GOOD').value
      const previousInterval = reviewSchedule.currentInterval
      const previousEaseFactor = reviewSchedule.easeFactor

      // Act
      const result = reviewSchedule.processReviewFeedback(
        feedback,
        calculator,
        mockClock,
        { responseTime: 45, answerContent: 'Test answer' }
      )

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(reviewSchedule.currentInterval).toBeGreaterThan(previousInterval)
      expect(reviewSchedule.reviewCount).toBe(4)
      expect(reviewSchedule.consecutiveFailures).toBe(0)
      expect(reviewSchedule.updatedAt).toEqual(mockClock.now())
    })

    test('AGAIN 피드백 시 연속 실패 횟수가 증가해야 함', () => {
      // Arrange
      const feedback = ReviewFeedback.create('AGAIN').value
      const previousFailures = reviewSchedule.consecutiveFailures

      // Act
      const result = reviewSchedule.processReviewFeedback(
        feedback,
        calculator,
        mockClock
      )

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(reviewSchedule.consecutiveFailures).toBe(previousFailures + 1)
    })

    test('성공적인 피드백 시 연속 실패 횟수가 리셋되어야 함', () => {
      // Arrange: 먼저 연속 실패 상태로 만듦
      reviewSchedule = ReviewSchedule.reconstitute({
        studentId: new UniqueEntityID('student-1'),
        problemId: new UniqueEntityID('problem-1'),
        reviewState: reviewSchedule.reviewState,
        consecutiveFailures: 2, // 이미 2번 실패
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-08')
      }, new UniqueEntityID('schedule-1'))

      const feedback = ReviewFeedback.create('GOOD').value

      // Act
      const result = reviewSchedule.processReviewFeedback(
        feedback,
        calculator,
        mockClock
      )

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(reviewSchedule.consecutiveFailures).toBe(0) // 리셋됨
    })

    test('ReviewCompletedEvent가 발행되어야 함', () => {
      // Arrange
      const feedback = ReviewFeedback.create('GOOD').value
      const initialEventCount = reviewSchedule.domainEvents.length

      // Act
      reviewSchedule.processReviewFeedback(
        feedback,
        calculator,
        mockClock,
        { responseTime: 30, answerContent: { selectedOption: 'A' } }
      )

      // Assert
      const events = reviewSchedule.domainEvents
      expect(events.length).toBeGreaterThan(initialEventCount)
      
      const reviewCompletedEvent = events.find(e => e.eventType === 'ReviewCompleted')
      expect(reviewCompletedEvent).toBeDefined()
    })

    test('ReviewNotificationScheduledEvent가 발행되어야 함', () => {
      // Arrange
      const feedback = ReviewFeedback.create('GOOD').value

      // Act
      reviewSchedule.processReviewFeedback(feedback, calculator, mockClock)

      // Assert
      const events = reviewSchedule.domainEvents
      const notificationEvents = events.filter(e => e.eventType === 'ReviewNotificationScheduled')
      
      // 기본 알림 + 필요시 추가 알림이 발행되어야 함
      expect(notificationEvents.length).toBeGreaterThanOrEqual(1)
    })

    test('어려운 문제에 대해 추가 알림이 스케줄링되어야 함', () => {
      // Arrange: 연속 실패가 많은 어려운 문제로 설정
      reviewSchedule = ReviewSchedule.reconstitute({
        studentId: new UniqueEntityID('student-1'),
        problemId: new UniqueEntityID('problem-1'),
        reviewState: ReviewState.create({
          interval: ReviewInterval.fromDays(7),
          easeFactor: EaseFactor.create(1.5).value, // 낮은 ease factor (어려운 문제)
          reviewCount: 3,
          lastReviewedAt: new Date('2024-01-08T10:00:00Z'),
          nextReviewAt: new Date('2024-01-15T10:00:00Z')
        }).value,
        consecutiveFailures: 2, // 연속 실패
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-08')
      }, new UniqueEntityID('schedule-1'))

      const feedback = ReviewFeedback.create('HARD').value

      // Act
      reviewSchedule.processReviewFeedback(feedback, calculator, mockClock)

      // Assert
      const events = reviewSchedule.domainEvents
      const notificationEvents = events.filter(e => e.eventType === 'ReviewNotificationScheduled')
      
      // 어려운 문제는 추가 알림이 스케줄링되어야 함 (기본 + 조기 알림)
      expect(notificationEvents.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('isDue 및 isOverdue 메서드', () => {
    test('복습 시간이 된 항목을 올바르게 식별해야 함', () => {
      // Arrange: 현재 시간이 복습 예정 시간과 동일
      mockClock.setTime(new Date('2024-01-22T10:00:00Z'))

      // Act & Assert
      expect(reviewSchedule.isDue(mockClock)).toBe(true)
      expect(reviewSchedule.isOverdue(mockClock)).toBe(false)
    })

    test('연체된 항목을 올바르게 식별해야 함', () => {
      // Arrange: 현재 시간이 복습 예정 시간보다 1시간 늦음
      mockClock.setTime(new Date('2024-01-22T11:00:00Z'))

      // Act & Assert
      expect(reviewSchedule.isDue(mockClock)).toBe(true)
      expect(reviewSchedule.isOverdue(mockClock)).toBe(true)
    })

    test('아직 복습 시간이 되지 않은 항목을 올바르게 식별해야 함', () => {
      // Arrange: 현재 시간이 복습 예정 시간보다 1시간 이름
      mockClock.setTime(new Date('2024-01-22T09:00:00Z'))

      // Act & Assert
      expect(reviewSchedule.isDue(mockClock)).toBe(false)
      expect(reviewSchedule.isOverdue(mockClock)).toBe(false)
    })
  })

  describe('difficulty level 및 retention probability', () => {
    test('ease factor에 따른 난이도 수준이 올바르게 계산되어야 함', () => {
      // Arrange: 다양한 ease factor로 테스트
      const beginnerSchedule = ReviewSchedule.reconstitute({
        studentId: new UniqueEntityID('student-1'),
        problemId: new UniqueEntityID('problem-1'),
        reviewState: ReviewState.create({
          interval: ReviewInterval.fromDays(7),
          easeFactor: EaseFactor.create(2.8).value, // 높은 값 (쉬움)
          reviewCount: 3,
          lastReviewedAt: new Date('2024-01-08'),
          nextReviewAt: new Date('2024-01-15')
        }).value,
        consecutiveFailures: 0,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-08')
      }, new UniqueEntityID('schedule-1'))

      const advancedSchedule = ReviewSchedule.reconstitute({
        studentId: new UniqueEntityID('student-1'),
        problemId: new UniqueEntityID('problem-1'),
        reviewState: ReviewState.create({
          interval: ReviewInterval.fromDays(7),
          easeFactor: EaseFactor.create(1.6).value, // 낮은 값 (어려움)
          reviewCount: 3,
          lastReviewedAt: new Date('2024-01-08'),
          nextReviewAt: new Date('2024-01-15')
        }).value,
        consecutiveFailures: 0,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-08')
      }, new UniqueEntityID('schedule-2'))

      // Act & Assert
      expect(beginnerSchedule.getDifficultyLevel()).toBe('beginner')
      expect(advancedSchedule.getDifficultyLevel()).toBe('advanced')
    })

    test('기억 보존 확률이 시간에 따라 감소해야 함', () => {
      // Arrange
      mockClock.setTime(new Date('2024-01-15T10:00:00Z')) // 복습 예정일
      const retentionAtDue = reviewSchedule.getRetentionProbability(mockClock)

      mockClock.advance(24) // 1일 후
      const retentionAfterDay = reviewSchedule.getRetentionProbability(mockClock)

      // Act & Assert
      expect(retentionAtDue).toBeGreaterThan(retentionAfterDay)
      expect(retentionAtDue).toBeLessThanOrEqual(1.0)
      expect(retentionAfterDay).toBeGreaterThanOrEqual(0.1)
    })
  })

  describe('triggerOverdueNotification', () => {
    test('연체된 복습에 대해 알림 이벤트를 발행해야 함', () => {
      // Arrange: 연체 상태로 만듦
      mockClock.setTime(new Date('2024-01-23T10:00:00Z')) // 1일 늦음
      const initialEventCount = reviewSchedule.domainEvents.length

      // Act
      reviewSchedule.triggerOverdueNotification(mockClock)

      // Assert
      const events = reviewSchedule.domainEvents
      expect(events.length).toBeGreaterThan(initialEventCount)

      const overdueEvent = events.find(e => 
        e.eventType === 'ReviewNotificationScheduled' &&
        (e as any).notificationType.value === 'review_overdue'
      )
      expect(overdueEvent).toBeDefined()
    })

    test('연체되지 않은 복습에 대해서는 알림을 발행하지 않아야 함', () => {
      // Arrange: 연체되지 않은 상태
      mockClock.setTime(new Date('2024-01-21T10:00:00Z')) // 1일 이름
      const initialEventCount = reviewSchedule.domainEvents.length

      // Act
      reviewSchedule.triggerOverdueNotification(mockClock)

      // Assert
      const events = reviewSchedule.domainEvents
      expect(events.length).toBe(initialEventCount) // 이벤트가 추가되지 않아야 함
    })
  })
})