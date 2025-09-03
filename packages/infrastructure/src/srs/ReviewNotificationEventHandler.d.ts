import { ReviewNotificationScheduledEvent } from '@woodie/domain/srs/events/ReviewNotificationScheduledEvent';
import { NotificationManagementService } from '../../../application/src/srs/services/NotificationManagementService';
/**
 * ReviewNotificationScheduled 이벤트 핸들러
 * 복습 일정 변경 시 발생하는 알림 이벤트를 처리하여 실시간 알림 전송
 *
 * 이벤트 처리 전략:
 * - 즉시 전송: 연체 알림, 긴급 알림
 * - 예약 전송: 일반 복습 알림 (별도 스케줄러 필요)
 * - 배치 처리: 여러 사용자에게 동시에 알림 전송
 */
export declare class ReviewNotificationEventHandler {
    private notificationService;
    constructor(notificationService: NotificationManagementService);
    /**
     * ReviewNotificationScheduled 이벤트 처리
     */
    handle(event: ReviewNotificationScheduledEvent): Promise<void>;
    /**
     * 즉시 전송 알림 처리
     * 연체 알림, 긴급 알림 등
     */
    private sendImmediateNotification;
    /**
     * 지연 전송 알림 처리
     * 실제로는 스케줄러나 큐 시스템에 등록
     * 현재 구현에서는 로깅만 수행
     */
    private scheduleDelayedNotification;
    /**
     * 알림 내용 생성
     * 알림 타입과 메타데이터를 기반으로 적절한 메시지 생성
     */
    private generateNotificationContent;
    /**
     * 이벤트 처리 가능 여부 확인
     */
    canHandle(eventType: string): boolean;
    /**
     * 배치로 여러 이벤트 처리 (성능 최적화용)
     */
    handleBatch(events: ReviewNotificationScheduledEvent[]): Promise<void>;
}
//# sourceMappingURL=ReviewNotificationEventHandler.d.ts.map