import { UniqueEntityID, Result, IClock, ISrsNotificationService as INotificationService, INotificationSettingsRepository, INotificationHistoryRepository, ChannelSubscription, NotificationType, NotificationSettings } from '@woodie/domain';
export interface ScheduleNotificationRequest {
    recipientId: string;
    type: NotificationType;
    scheduledFor: Date;
    title: string;
    body: string;
    data?: Record<string, any>;
}
export interface NotificationStatistics {
    totalSent: number;
    successRate: number;
    averageDeliveryTime: number;
    notificationsByType: Record<string, number>;
    activeSubscriptions: number;
    recentFailures: number;
}
/**
 * 알림 관리 서비스 (Application Layer)
 * 도메인 인터페이스들을 조합하여 알림 관련 유스케이스 구현
 * Infrastructure 레이어와는 인터페이스를 통해서만 소통
 */
export declare class NotificationManagementService {
    private notificationService;
    private settingsRepository;
    private historyRepository;
    private clock;
    constructor(notificationService: INotificationService, // Supabase Realtime 구현체
    settingsRepository: INotificationSettingsRepository, // 설정 저장소
    historyRepository: INotificationHistoryRepository, // 이력 저장소
    clock: IClock);
    /**
     * 사용자 알림 채널 초기화
     * 로그인 시 또는 앱 시작 시 호출
     */
    initializeUserNotifications(userId: UniqueEntityID): Promise<Result<ChannelSubscription>>;
    /**
     * 즉시 알림 전송
     * 긴급 알림이나 실시간 피드백 시 사용
     */
    sendImmediateNotification(recipientId: UniqueEntityID, type: NotificationType, title: string, body: string, data?: Record<string, any>): Promise<Result<void>>;
    /**
     * 예약 알림 전송 (배치)
     * 스케줄러나 백그라운드 작업에서 호출
     */
    sendScheduledNotifications(requests: ScheduleNotificationRequest[]): Promise<Result<number>>;
    /**
     * 사용자 알림 설정 업데이트
     */
    updateNotificationSettings(userId: UniqueEntityID, updates: Partial<{
        enabled: boolean;
        reviewReminders: boolean;
        overdueReminders: boolean;
        dailySummary: boolean;
        milestoneAlerts: boolean;
        quietHours: {
            start: string;
            end: string;
        };
        timezone: string;
    }>): Promise<Result<NotificationSettings>>;
    /**
     * 사용자 알림 통계 조회
     */
    getNotificationStatistics(userId: UniqueEntityID): Promise<Result<NotificationStatistics>>;
    /**
     * 알림 채널 정리 (로그아웃 시)
     */
    cleanupUserNotifications(userId: UniqueEntityID): Promise<Result<void>>;
    /**
     * 고유한 알림 ID 생성
     */
    private generateNotificationId;
    /**
     * 평균 전송 시간 계산 (밀리초)
     */
    private calculateAverageDeliveryTime;
    /**
     * 알림 타입별 그룹화
     */
    private groupNotificationsByType;
}
//# sourceMappingURL=NotificationManagementService.d.ts.map