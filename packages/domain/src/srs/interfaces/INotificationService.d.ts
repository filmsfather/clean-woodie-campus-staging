import { UniqueEntityID } from '../../common/Identifier';
import { Result } from '../../common/Result';
import { NotificationType } from '../value-objects/NotificationType';
import { NotificationSettings } from '../value-objects/NotificationSettings';
export interface NotificationMessage {
    id: string;
    recipientId: string;
    type: NotificationType;
    title: string;
    body: string;
    data?: Record<string, any>;
    scheduledAt: Date;
    sentAt?: Date;
}
export interface ChannelSubscription {
    channelId: string;
    userId: string;
    isActive: boolean;
    subscribedAt: Date;
}
/**
 * 실시간 알림 서비스 도메인 인터페이스
 * Infrastructure 레이어에서 구현됨 (Supabase Realtime)
 */
export interface INotificationService {
    /**
     * 사용자별 알림 채널 생성 및 구독
     */
    subscribeToUserChannel(userId: UniqueEntityID): Promise<Result<ChannelSubscription>>;
    /**
     * 채널 구독 해제
     */
    unsubscribeFromChannel(channelId: string): Promise<Result<void>>;
    /**
     * 실시간 알림 전송
     */
    sendNotification(message: NotificationMessage): Promise<Result<void>>;
    /**
     * 여러 사용자에게 알림 전송 (배치)
     */
    sendBatchNotifications(messages: NotificationMessage[]): Promise<Result<void>>;
    /**
     * 예약된 알림 취소
     */
    cancelScheduledNotification(notificationId: string): Promise<Result<void>>;
    /**
     * 사용자의 활성 구독 조회
     */
    getActiveSubscriptions(userId: UniqueEntityID): Promise<Result<ChannelSubscription[]>>;
}
/**
 * 알림 설정 리포지토리 인터페이스
 */
export interface INotificationSettingsRepository {
    /**
     * 사용자 알림 설정 조회
     */
    findByUserId(userId: UniqueEntityID): Promise<NotificationSettings | null>;
    /**
     * 알림 설정 저장
     */
    save(userId: UniqueEntityID, settings: NotificationSettings): Promise<void>;
    /**
     * 알림 설정 삭제
     */
    delete(userId: UniqueEntityID): Promise<void>;
    /**
     * 특정 알림 타입이 활성화된 사용자 목록 조회
     */
    findUsersWithEnabledNotification(type: 'review' | 'overdue' | 'summary' | 'milestone'): Promise<UniqueEntityID[]>;
}
/**
 * 알림 이력 리포지토리 인터페이스
 */
export interface INotificationHistoryRepository {
    /**
     * 알림 전송 이력 저장
     */
    saveNotification(message: NotificationMessage): Promise<void>;
    /**
     * 사용자별 알림 이력 조회
     */
    findByUserId(userId: UniqueEntityID, limit?: number): Promise<NotificationMessage[]>;
    /**
     * 전송 실패한 알림 조회 (재시도용)
     */
    findFailedNotifications(limit?: number): Promise<NotificationMessage[]>;
    /**
     * 알림 상태 업데이트 (전송 완료)
     */
    markAsSent(notificationId: string, sentAt: Date): Promise<void>;
    /**
     * 오래된 알림 이력 삭제 (데이터 정리용)
     */
    deleteOldNotifications(olderThan: Date): Promise<void>;
}
//# sourceMappingURL=INotificationService.d.ts.map