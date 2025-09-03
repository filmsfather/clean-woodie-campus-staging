import { BaseDomainEvent } from '../../events/DomainEvent';
import { UniqueEntityID } from '../../common/Identifier';
import { NotificationType } from '../value-objects/NotificationType';
/**
 * 복습 알림 예약 이벤트
 * 복습 스케줄이 생성/업데이트될 때 발생하여
 * 알림 시스템이 적절한 시점에 알림을 전송하도록 트리거
 */
export declare class ReviewNotificationScheduledEvent extends BaseDomainEvent {
    readonly scheduleId: UniqueEntityID;
    readonly studentId: UniqueEntityID;
    readonly problemId: UniqueEntityID;
    readonly notificationType: NotificationType;
    readonly scheduledFor: Date;
    readonly reviewDueAt: Date;
    readonly priority: 'high' | 'medium' | 'low';
    readonly metadata?: Record<string, any> | undefined;
    readonly eventType = "ReviewNotificationScheduled";
    constructor(scheduleId: UniqueEntityID, // 복습 스케줄 ID
    studentId: UniqueEntityID, // 학생 ID  
    problemId: UniqueEntityID, // 문제 ID
    notificationType: NotificationType, // 알림 타입
    scheduledFor: Date, // 알림 예정 시각
    reviewDueAt: Date, // 복습 예정 시각
    priority?: 'high' | 'medium' | 'low', metadata?: Record<string, any> | undefined);
    /**
     * 일반 복습 알림 이벤트 생성
     */
    static createReviewDueEvent(scheduleId: UniqueEntityID, studentId: UniqueEntityID, problemId: UniqueEntityID, reviewDueAt: Date, reminderTime: Date): ReviewNotificationScheduledEvent;
    /**
     * 연체 알림 이벤트 생성
     */
    static createOverdueEvent(scheduleId: UniqueEntityID, studentId: UniqueEntityID, problemId: UniqueEntityID, reviewDueAt: Date, overdueHours: number): ReviewNotificationScheduledEvent;
}
//# sourceMappingURL=ReviewNotificationScheduledEvent.d.ts.map