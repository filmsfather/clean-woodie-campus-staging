import { BaseDomainEvent } from '../../events/DomainEvent';
import { NotificationType } from '../value-objects/NotificationType';
/**
 * 복습 알림 예약 이벤트
 * 복습 스케줄이 생성/업데이트될 때 발생하여
 * 알림 시스템이 적절한 시점에 알림을 전송하도록 트리거
 */
export class ReviewNotificationScheduledEvent extends BaseDomainEvent {
    scheduleId;
    studentId;
    problemId;
    notificationType;
    scheduledFor;
    reviewDueAt;
    priority;
    metadata;
    eventType = 'ReviewNotificationScheduled';
    constructor(scheduleId, // 복습 스케줄 ID
    studentId, // 학생 ID  
    problemId, // 문제 ID
    notificationType, // 알림 타입
    scheduledFor, // 알림 예정 시각
    reviewDueAt, // 복습 예정 시각
    priority = 'medium', metadata // 추가 메타데이터
    ) {
        super();
        this.scheduleId = scheduleId;
        this.studentId = studentId;
        this.problemId = problemId;
        this.notificationType = notificationType;
        this.scheduledFor = scheduledFor;
        this.reviewDueAt = reviewDueAt;
        this.priority = priority;
        this.metadata = metadata;
    }
    /**
     * 일반 복습 알림 이벤트 생성
     */
    static createReviewDueEvent(scheduleId, studentId, problemId, reviewDueAt, reminderTime) {
        return new ReviewNotificationScheduledEvent(scheduleId, studentId, problemId, NotificationType.reviewDue(), reminderTime, reviewDueAt, 'medium');
    }
    /**
     * 연체 알림 이벤트 생성
     */
    static createOverdueEvent(scheduleId, studentId, problemId, reviewDueAt, overdueHours) {
        return new ReviewNotificationScheduledEvent(scheduleId, studentId, problemId, NotificationType.reviewOverdue(), new Date(), // 즉시 알림
        reviewDueAt, 'high', { overdueHours });
    }
}
//# sourceMappingURL=ReviewNotificationScheduledEvent.js.map