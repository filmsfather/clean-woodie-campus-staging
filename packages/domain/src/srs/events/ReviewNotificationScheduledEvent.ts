import { BaseDomainEvent } from '../../events/DomainEvent'
import { UniqueEntityID } from '../../common/Identifier'
import { NotificationType } from '../value-objects/NotificationType'

/**
 * 복습 알림 예약 이벤트
 * 복습 스케줄이 생성/업데이트될 때 발생하여
 * 알림 시스템이 적절한 시점에 알림을 전송하도록 트리거
 */
export class ReviewNotificationScheduledEvent extends BaseDomainEvent {
  public readonly eventType = 'ReviewNotificationScheduled'

  constructor(
    public readonly scheduleId: UniqueEntityID,      // 복습 스케줄 ID
    public readonly studentId: UniqueEntityID,       // 학생 ID  
    public readonly problemId: UniqueEntityID,       // 문제 ID
    public readonly notificationType: NotificationType, // 알림 타입
    public readonly scheduledFor: Date,              // 알림 예정 시각
    public readonly reviewDueAt: Date,               // 복습 예정 시각
    public readonly priority: 'high' | 'medium' | 'low' = 'medium',
    public readonly metadata?: Record<string, any>   // 추가 메타데이터
  ) {
    super()
  }

  /**
   * 일반 복습 알림 이벤트 생성
   */
  public static createReviewDueEvent(
    scheduleId: UniqueEntityID,
    studentId: UniqueEntityID,
    problemId: UniqueEntityID,
    reviewDueAt: Date,
    reminderTime: Date
  ): ReviewNotificationScheduledEvent {
    return new ReviewNotificationScheduledEvent(
      scheduleId,
      studentId,
      problemId,
      NotificationType.reviewDue(),
      reminderTime,
      reviewDueAt,
      'medium'
    )
  }

  /**
   * 연체 알림 이벤트 생성
   */
  public static createOverdueEvent(
    scheduleId: UniqueEntityID,
    studentId: UniqueEntityID,
    problemId: UniqueEntityID,
    reviewDueAt: Date,
    overdueHours: number
  ): ReviewNotificationScheduledEvent {
    return new ReviewNotificationScheduledEvent(
      scheduleId,
      studentId,
      problemId,
      NotificationType.reviewOverdue(),
      new Date(), // 즉시 알림
      reviewDueAt,
      'high',
      { overdueHours }
    )
  }
}