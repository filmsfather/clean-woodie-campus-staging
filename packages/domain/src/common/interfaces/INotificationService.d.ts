import { Result } from '../Result';
export interface NotificationPayload {
    recipient: string;
    type: string;
    title: string;
    message: string;
    data?: Record<string, any>;
}
/**
 * 공통 알림 서비스 인터페이스
 * 다양한 도메인에서 사용할 수 있는 범용 알림 서비스
 */
export interface INotificationService {
    sendNotification(payload: NotificationPayload): Promise<Result<void>>;
    sendBatchNotifications(payloads: NotificationPayload[]): Promise<Result<void>>;
}
//# sourceMappingURL=INotificationService.d.ts.map