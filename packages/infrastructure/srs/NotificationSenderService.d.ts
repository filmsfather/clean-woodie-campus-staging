import { UniqueEntityID, Result } from '@woodie/domain';
export interface NotificationSendRequest {
    notificationId: UniqueEntityID;
    studentId: UniqueEntityID;
    type: string;
    title: string;
    message: string;
    deliveryMethod: 'push' | 'email' | 'in_app';
    priority: 'low' | 'medium' | 'high' | 'critical';
    metadata?: any;
}
export interface INotificationSender {
    send(request: NotificationSendRequest): Promise<Result<void>>;
}
export interface INotificationChannel {
    send(request: NotificationSendRequest): Promise<Result<void>>;
    isAvailable(): Promise<boolean>;
    getChannelType(): 'push' | 'email' | 'in_app';
}
/**
 * 푸시 알림 채널
 */
export declare class PushNotificationChannel implements INotificationChannel {
    getChannelType(): 'push';
    isAvailable(): Promise<boolean>;
    send(request: NotificationSendRequest): Promise<Result<void>>;
    private simulateNetworkDelay;
}
/**
 * 이메일 알림 채널
 */
export declare class EmailNotificationChannel implements INotificationChannel {
    getChannelType(): 'email';
    isAvailable(): Promise<boolean>;
    send(request: NotificationSendRequest): Promise<Result<void>>;
    private simulateNetworkDelay;
}
/**
 * 인앱 알림 채널
 */
export declare class InAppNotificationChannel implements INotificationChannel {
    getChannelType(): 'in_app';
    isAvailable(): Promise<boolean>;
    send(request: NotificationSendRequest): Promise<Result<void>>;
    private simulateNetworkDelay;
}
/**
 * 알림 발송 서비스
 * 여러 채널을 관리하고 적절한 채널로 알림을 발송
 */
export declare class NotificationSenderService implements INotificationSender {
    private channels;
    constructor();
    send(request: NotificationSendRequest): Promise<Result<void>>;
    /**
     * 특정 채널 교체 (테스트나 설정 변경 시 사용)
     */
    replaceChannel(channelType: 'push' | 'email' | 'in_app', channel: INotificationChannel): void;
    /**
     * 채널 상태 조회
     */
    getChannelStatuses(): Promise<Record<string, boolean>>;
}
/**
 * 테스트용 Mock Notification Sender
 */
export declare class MockNotificationSenderService implements INotificationSender {
    private sentNotifications;
    private shouldFail;
    send(request: NotificationSendRequest): Promise<Result<void>>;
    setShouldFail(shouldFail: boolean): void;
    getSentNotifications(): NotificationSendRequest[];
    clearSentNotifications(): void;
}
//# sourceMappingURL=NotificationSenderService.d.ts.map