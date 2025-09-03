import { AggregateRoot } from '../../aggregates/AggregateRoot'
import { UniqueEntityID } from '../../common/Identifier'
import { Result } from '../../common/Result'
import { Guard } from '../../common/Guard'
import { ReviewFeedback } from '../value-objects/ReviewFeedback'
import { ReviewState } from '../value-objects/ReviewState'
import { EaseFactor } from '../value-objects/EaseFactor'
import { ISpacedRepetitionPolicy } from '../services/ISpacedRepetitionPolicy'
import { IClock } from '../services/IClock'
import { ReviewCompletedEvent } from '../events/ReviewCompletedEvent'
import { ReviewScheduledEvent } from '../events/ReviewScheduledEvent'
import { ReviewNotificationScheduledEvent } from '../events/ReviewNotificationScheduledEvent'
import { NotificationType } from '../value-objects/NotificationType'
import { SrsPolicy } from '../services/SrsPolicy'

interface ReviewScheduleProps {
  studentId: UniqueEntityID
  problemId: UniqueEntityID
  reviewState: ReviewState
  consecutiveFailures: number
  createdAt: Date
  updatedAt: Date
}

export class ReviewSchedule extends AggregateRoot<UniqueEntityID> {
  private constructor(private props: ReviewScheduleProps, id?: UniqueEntityID) {
    super(id || new UniqueEntityID())
  }

  get studentId(): UniqueEntityID {
    return this.props.studentId
  }

  get problemId(): UniqueEntityID {
    return this.props.problemId
  }

  get reviewState(): ReviewState {
    return this.props.reviewState
  }

  get consecutiveFailures(): number {
    return this.props.consecutiveFailures
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  // 편의 메서드들
  get currentInterval(): number {
    return this.reviewState.interval.days
  }

  get easeFactor(): number {
    return this.reviewState.easeFactor.value
  }

  get reviewCount(): number {
    return this.reviewState.reviewCount
  }

  get lastReviewedAt(): Date | null {
    return this.reviewState.lastReviewedAt
  }

  get nextReviewAt(): Date {
    return this.reviewState.nextReviewAt
  }

  /**
   * 새로운 ReviewSchedule 생성
   */
  public static create(props: {
    studentId: UniqueEntityID
    problemId: UniqueEntityID
    reviewState: ReviewState
    consecutiveFailures?: number
  }, id?: UniqueEntityID): Result<ReviewSchedule> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.studentId, argumentName: 'studentId' },
      { argument: props.problemId, argumentName: 'problemId' },
      { argument: props.reviewState, argumentName: 'reviewState' }
    ])

    if (guardResult.isFailure) {
      return Result.fail<ReviewSchedule>(guardResult.error)
    }

    const now = new Date()
    const reviewSchedule = new ReviewSchedule({
      studentId: props.studentId,
      problemId: props.problemId,
      reviewState: props.reviewState,
      consecutiveFailures: props.consecutiveFailures ?? 0,
      createdAt: now,
      updatedAt: now
    }, id)

    // 생성 이벤트 발행
    reviewSchedule.addDomainEvent(new ReviewScheduledEvent(
      reviewSchedule.id,
      props.studentId,
      props.problemId,
      props.reviewState.nextReviewAt
    ))

    return Result.ok<ReviewSchedule>(reviewSchedule)
  }

  /**
   * 재구성 팩토리 메서드 (DB에서 복원할 때 사용)
   */
  public static reconstitute(
    props: ReviewScheduleProps,
    id: UniqueEntityID
  ): ReviewSchedule {
    return new ReviewSchedule(props, id)
  }

  /**
   * 복습 피드백 처리 (StudyRecord 생성 정보 포함)
   * 의존성 주입을 통해 순수성 유지
   */
  public processReviewFeedback(
    feedback: ReviewFeedback,
    policy: ISpacedRepetitionPolicy,
    clock: IClock,
    studyInfo?: {
      responseTime?: number
      answerContent?: any
    }
  ): Result<void> {
    const feedbackGuard = Guard.againstNullOrUndefined(feedback, 'feedback')
    if (feedbackGuard.isFailure) {
      return Result.fail<void>(feedbackGuard.error)
    }

    const policyGuard = Guard.againstNullOrUndefined(policy, 'policy')
    if (policyGuard.isFailure) {
      return Result.fail<void>(policyGuard.error)
    }

    const clockGuard = Guard.againstNullOrUndefined(clock, 'clock')
    if (clockGuard.isFailure) {
      return Result.fail<void>(clockGuard.error)
    }

    try {
      const reviewedAt = clock.now()
      
      // 1. 현재 상태 캡처 (이벤트에서 사용할 이전 값들)
      const currentState = this.reviewState
      const currentFailures = this.consecutiveFailures
      
      // 2. 늦은 복습에 대한 페널티 적용
      const lateReviewAdjustment = policy.adjustForLateReview(currentState, reviewedAt)
      
      // 3. 조정된 상태로 새로운 간격 계산
      const adjustedState = currentState.withNewReview(
        lateReviewAdjustment.newInterval,
        lateReviewAdjustment.newEaseFactor,
        reviewedAt
      )
      
      const calculationResult = policy.calculateNextInterval(adjustedState, feedback)
      const { newInterval, newEaseFactor } = calculationResult
      
      // 4. 연속 실패 횟수 계산
      const newConsecutiveFailures = feedback.isAgain() ? currentFailures + 1 : 0
      
      // 5. 연속 실패 시 간격 리셋 검사
      let finalInterval = newInterval
      let finalEaseFactor = newEaseFactor
      
      if (policy.shouldResetInterval(currentState, newConsecutiveFailures)) {
        finalInterval = currentState.interval.days > 1 ? currentState.interval : newInterval
        finalEaseFactor = EaseFactor.minimum()
      }
      
      // 6. 새로운 복습 상태 생성
      const newReviewState = currentState.withNewReview(
        finalInterval,
        finalEaseFactor,
        reviewedAt
      )
      
      // 7. 이벤트 먼저 생성 (현재 상태 기반으로 이전 값들 캡처)
      this.addDomainEvent(new ReviewCompletedEvent({
        aggregateId: this.id.toString(),
        studentId: this.studentId.toString(),
        problemId: this.problemId.toString(),
        feedback: feedback.value,
        previousInterval: currentState.interval.days,        // 올바른 이전 값
        newInterval: finalInterval.days,
        previousEaseFactor: currentState.easeFactor.value,   // 올바른 이전 값
        newEaseFactor: finalEaseFactor.value,
        reviewCount: newReviewState.reviewCount,
        nextReviewAt: newReviewState.nextReviewAt,
        occurredAt: reviewedAt,
        // StudyRecord 생성을 위한 정보
        isCorrect: !feedback.isAgain(), // AGAIN이 아니면 정답으로 간주
        responseTime: studyInfo?.responseTime,
        answerContent: studyInfo?.answerContent
      }))
      
      // 8. 알림 스케줄링 이벤트 발행 (다음 복습에 대한)
      this.scheduleNotificationEvents(newReviewState.nextReviewAt)
      
      // 9. 상태 변경은 마지막에
      this.props.reviewState = newReviewState
      this.props.consecutiveFailures = newConsecutiveFailures
      this.props.updatedAt = reviewedAt
      
      return Result.ok<void>()
      
    } catch (error) {
      return Result.fail<void>(`Review processing failed: ${error}`)
    }
  }

  /**
   * 복습 예정 여부 확인
   */
  public isDue(clock: IClock): boolean {
    return this.reviewState.isDue(clock.now())
  }

  /**
   * 복습 기한 초과 여부 확인
   */
  public isOverdue(clock: IClock): boolean {
    return this.reviewState.isOverdue(clock.now())
  }

  /**
   * 복습까지 남은 시간 (분 단위)
   */
  public minutesUntilDue(clock: IClock): number {
    return this.reviewState.minutesUntilDue(clock.now())
  }

  /**
   * 현재 난이도 수준 평가
   */
  public getDifficultyLevel(): 'beginner' | 'intermediate' | 'advanced' {
    const easeFactor = this.reviewState.easeFactor.value
    if (easeFactor <= SrsPolicy.EXTRA_REMINDER_EASE_THRESHOLD) return 'advanced'
    if (easeFactor <= SrsPolicy.INTERMEDIATE_EASE_THRESHOLD) return 'intermediate'
    return 'beginner'
  }

  /**
   * 현재 기억 보존 확률 추정
   */
  public getRetentionProbability(clock: IClock): number {
    const daysSinceReview = this.reviewState.daysSinceLastReview(clock.now())
    const intervalDays = this.reviewState.interval.days
    
    if (daysSinceReview <= 0) return 1.0
    
    // 에빙하우스 망각곡선 근사
    const retention = Math.exp(-daysSinceReview / intervalDays)
    return Math.max(0.1, Math.min(1.0, retention))
  }

  /**
   * 연체 알림 이벤트 발행 (외부에서 호출)
   * 스케줄러나 백그라운드 작업에서 연체된 복습 감지 시 호출
   */
  public triggerOverdueNotification(clock: IClock): void {
    if (!this.isOverdue(clock)) {
      return // 연체되지 않았으면 알림 발행 안 함
    }

    const overdueHours = Math.floor(
      (clock.now().getTime() - this.nextReviewAt.getTime()) / (1000 * 60 * 60)
    )

    // 연체 알림 이벤트 발행
    this.addDomainEvent(
      ReviewNotificationScheduledEvent.createOverdueEvent(
        this.id,
        this.studentId,
        this.problemId,
        this.nextReviewAt,
        overdueHours
      )
    )
  }

  /**
   * 알림 스케줄링 이벤트들 발행
   * 복습 완료 후 다음 복습에 대한 알림들을 예약
   */
  private scheduleNotificationEvents(nextReviewAt: Date): void {
    // 1. 기본 복습 알림 (정책에 정의된 시간 전)
    const reminderTime = new Date(nextReviewAt.getTime() - SrsPolicy.DEFAULT_REMINDER_MINUTES * 60 * 1000)
    
    // 과거 시점이면 알림 스케줄링하지 않음
    if (reminderTime.getTime() > Date.now()) {
      this.addDomainEvent(
        ReviewNotificationScheduledEvent.createReviewDueEvent(
          this.id,
          this.studentId,
          this.problemId,
          nextReviewAt,
          reminderTime
        )
      )
    }

    // 2. 어려운 문제 (연속 실패 있거나 낮은 ease factor)에 대한 추가 알림
    if (this.shouldScheduleExtraReminders()) {
      // 정책에 정의된 시간 전 추가 알림
      const earlyReminderTime = new Date(nextReviewAt.getTime() - SrsPolicy.EARLY_REMINDER_MINUTES * 60 * 1000)
      
      if (earlyReminderTime.getTime() > Date.now()) {
        this.addDomainEvent(
          new ReviewNotificationScheduledEvent(
            this.id,
            this.studentId,
            this.problemId,
            NotificationType.reviewDue(),
            earlyReminderTime,
            nextReviewAt,
            'high', // 어려운 문제라서 높은 우선순위
            {
              reminderMinutesBefore: SrsPolicy.EARLY_REMINDER_MINUTES,
              notificationReason: 'difficult_problem_early_reminder',
              consecutiveFailures: this.consecutiveFailures,
              easeFactor: this.easeFactor
            }
          )
        )
      }
    }
  }

  /**
   * 추가 알림이 필요한지 판단
   * 어려운 문제나 연속 실패한 문제에 대해 더 많은 알림 제공
   */
  private shouldScheduleExtraReminders(): boolean {
    return (
      this.consecutiveFailures >= SrsPolicy.EXTRA_REMINDER_FAILURE_THRESHOLD || // 정책에 정의된 연속 실패 횟수
      this.easeFactor <= SrsPolicy.EXTRA_REMINDER_EASE_THRESHOLD ||              // 정책에 정의된 최대 ease factor
      this.getDifficultyLevel() === 'advanced'                                   // 고급 난이도
    )
  }
}