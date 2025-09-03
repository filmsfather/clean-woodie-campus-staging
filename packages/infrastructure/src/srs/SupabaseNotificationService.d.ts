import { SupabaseClient } from '@supabase/supabase-js';
import { UniqueEntityID } from '@domain/common/Identifier';
import { Result } from '@domain/common/Result';
import { INotificationService, NotificationMessage, ChannelSubscription } from '@domain/srs/interfaces/INotificationService';
import { BaseRepository } from '../repositories/BaseRepository';
/**
 * Supabase Realtime 기반 알림 서비스 구현체
 * WebSocket을 통한 실시간 알림 전송 및 채널 관리
 */
export declare class SupabaseNotificationService extends BaseRepository implements INotificationService {
    private activeChannels;
    private reconnectAttempts;
    private readonly maxReconnectAttempts;
    constructor(client?: SupabaseClient);
    /**
     * 사용자별 알림 채널 생성 및 구독
     * 채널명: notifications:{userId}
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
     * 배치 알림 전송
     */
    sendBatchNotifications(messages: NotificationMessage[]): Promise<Result<void>>;
    /**
     * 예약된 알림 취소 (현재 구현에서는 즉시 전송만 지원)
     */
    cancelScheduledNotification(notificationId: string): Promise<Result<void>>;
    /**
     * 사용자의 활성 구독 조회
     */
    getActiveSubscriptions(userId: UniqueEntityID): Promise<Result<ChannelSubscription[]>>;
    /**
     * 모든 채널 정리 (앱 종료 시)
     */
    cleanup(): Promise<void>;
    /**
     * 알림 수신 핸들러
     * 클라이언트 측에서 오버라이드하여 UI 알림 표시
     */
    private handleNotificationReceived;
    /**
     * 채널 상태 변화 핸들러
     * 연결 끊김 시 자동 재연결 시도
     */
    private handleChannelStatusChange;
    /**
     * 채널 재연결
     */
    private reconnectChannel;
}
//# sourceMappingURL=SupabaseNotificationService.d.ts.map