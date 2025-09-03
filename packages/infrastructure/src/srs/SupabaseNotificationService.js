import { UniqueEntityID } from '@woodie/domain/common/Identifier';
import { Result } from '@woodie/domain/common/Result';
import { BaseRepository } from '../repositories/BaseRepository';
/**
 * Supabase Realtime 기반 알림 서비스 구현체
 * WebSocket을 통한 실시간 알림 전송 및 채널 관리
 */
export class SupabaseNotificationService extends BaseRepository {
    client;
    activeChannels = new Map();
    reconnectAttempts = new Map();
    maxReconnectAttempts = 3;
    constructor(client) {
        super();
        this.client = client;
    }
    // BaseRepository abstract 메서드들 구현 (알림 서비스에서는 사용 안함)
    async findById(id) {
        console.warn('findById not applicable for NotificationService');
        return null;
    }
    async save(entity) {
        await this.sendNotification(entity);
    }
    async delete(id) {
        console.warn('delete not applicable for NotificationService');
    }
    /**
     * 사용자별 알림 채널 생성 및 구독
     * 채널명: notifications:{userId}
     */
    async subscribeToUserChannel(userId) {
        try {
            const channelId = `notifications:${userId.toString()}`;
            // 기존 채널이 있으면 재사용
            if (this.activeChannels.has(channelId)) {
                const existingChannel = this.activeChannels.get(channelId);
                if (existingChannel.state === 'joined') {
                    return Result.ok({
                        channelId,
                        userId: userId.toString(),
                        isActive: true,
                        subscribedAt: new Date()
                    });
                }
            }
            // 새 채널 생성
            const channel = this.client.channel(channelId, {
                config: {
                    broadcast: { self: false }, // 자신이 보낸 메시지 제외
                    presence: { key: userId.toString() }
                }
            });
            // 메시지 수신 핸들러 설정
            channel.on('broadcast', { event: 'notification' }, (payload) => {
                this.handleNotificationReceived(userId, payload);
            });
            // 연결 상태 변화 핸들러
            channel.on('system', {}, (payload) => {
                this.handleChannelStatusChange(channelId, payload);
            });
            // 구독 시작
            const subscribeStatus = await new Promise((resolve) => {
                const subscription = channel.subscribe((status) => {
                    resolve(status);
                });
                // 타임아웃 설정 (10초)
                setTimeout(() => resolve('timed_out'), 10000);
            });
            if (subscribeStatus !== 'ok') {
                channel.unsubscribe();
                return Result.fail(`Channel subscription failed: ${subscribeStatus}`);
            }
            // 성공적으로 구독된 채널 저장
            this.activeChannels.set(channelId, channel);
            this.reconnectAttempts.set(channelId, 0);
            console.log(`✅ Subscribed to notification channel: ${channelId}`);
            return Result.ok({
                channelId,
                userId: userId.toString(),
                isActive: true,
                subscribedAt: new Date()
            });
        }
        catch (error) {
            console.error('Failed to subscribe to user channel:', error);
            return Result.fail(`Subscription failed: ${error}`);
        }
    }
    /**
     * 채널 구독 해제
     */
    async unsubscribeFromChannel(channelId) {
        try {
            const channel = this.activeChannels.get(channelId);
            if (channel) {
                await channel.unsubscribe();
                this.activeChannels.delete(channelId);
                this.reconnectAttempts.delete(channelId);
                console.log(`🔌 Unsubscribed from channel: ${channelId}`);
            }
            return Result.ok();
        }
        catch (error) {
            console.error(`Failed to unsubscribe from channel ${channelId}:`, error);
            return Result.fail(`Unsubscribe failed: ${error}`);
        }
    }
    /**
     * 실시간 알림 전송
     */
    async sendNotification(message) {
        try {
            const channelId = `notifications:${message.recipientId}`;
            // 채널이 활성화되어 있는지 확인
            const channel = this.activeChannels.get(channelId);
            if (!channel || channel.state !== 'joined') {
                return Result.fail(`Channel ${channelId} is not active`);
            }
            // 알림 메시지 포맷
            const notificationPayload = {
                type: 'notification',
                payload: {
                    id: message.id,
                    title: message.title,
                    body: message.body,
                    type: message.type.value,
                    data: message.data,
                    timestamp: message.scheduledAt.toISOString()
                }
            };
            // Broadcast 전송
            const broadcastResult = await channel.send({
                type: 'broadcast',
                event: 'notification',
                payload: notificationPayload.payload
            });
            if (broadcastResult !== 'ok') {
                return Result.fail(`Broadcast failed: ${broadcastResult}`);
            }
            console.log(`📬 Notification sent to ${channelId}: ${message.title}`);
            return Result.ok();
        }
        catch (error) {
            console.error('Failed to send notification:', error);
            return Result.fail(`Send notification failed: ${error}`);
        }
    }
    /**
     * 배치 알림 전송
     */
    async sendBatchNotifications(messages) {
        try {
            const results = [];
            // 병렬 전송 (채널별로 그룹화하여 효율성 향상)
            const messagesByChannel = new Map();
            for (const message of messages) {
                const channelId = `notifications:${message.recipientId}`;
                if (!messagesByChannel.has(channelId)) {
                    messagesByChannel.set(channelId, []);
                }
                messagesByChannel.get(channelId).push(message);
            }
            // 채널별 배치 전송
            for (const [channelId, channelMessages] of messagesByChannel) {
                const channel = this.activeChannels.get(channelId);
                if (!channel || channel.state !== 'joined') {
                    console.warn(`⚠️ Channel ${channelId} is not active, skipping ${channelMessages.length} messages`);
                    continue;
                }
                // 단일 채널에 여러 알림 전송
                for (const message of channelMessages) {
                    const result = await this.sendNotification(message);
                    results.push(result);
                }
            }
            // 실패한 전송이 있는지 확인
            const failures = results.filter(r => r.isFailure);
            if (failures.length > 0) {
                console.warn(`⚠️ ${failures.length}/${results.length} notifications failed to send`);
                return Result.fail(`${failures.length} notifications failed`);
            }
            console.log(`✅ Successfully sent ${results.length} notifications`);
            return Result.ok();
        }
        catch (error) {
            console.error('Batch notification sending failed:', error);
            return Result.fail(`Batch send failed: ${error}`);
        }
    }
    /**
     * 예약된 알림 취소 (현재 구현에서는 즉시 전송만 지원)
     */
    async cancelScheduledNotification(notificationId) {
        // Supabase Realtime은 예약 전송을 직접 지원하지 않음
        // 실제로는 별도의 스케줄러 서비스나 데이터베이스 기반 큐가 필요
        console.warn(`⚠️ Notification cancellation not supported for ID: ${notificationId}`);
        return Result.ok();
    }
    /**
     * 사용자의 활성 구독 조회
     */
    async getActiveSubscriptions(userId) {
        try {
            const channelId = `notifications:${userId.toString()}`;
            const subscriptions = [];
            if (this.activeChannels.has(channelId)) {
                const channel = this.activeChannels.get(channelId);
                if (channel.state === 'joined') {
                    subscriptions.push({
                        channelId,
                        userId: userId.toString(),
                        isActive: true,
                        subscribedAt: new Date() // 실제로는 구독 시작 시간을 저장해야 함
                    });
                }
            }
            return Result.ok(subscriptions);
        }
        catch (error) {
            return Result.fail(`Failed to get active subscriptions: ${error}`);
        }
    }
    /**
     * 모든 채널 정리 (앱 종료 시)
     */
    async cleanup() {
        const channelIds = Array.from(this.activeChannels.keys());
        for (const channelId of channelIds) {
            await this.unsubscribeFromChannel(channelId);
        }
        this.activeChannels.clear();
        this.reconnectAttempts.clear();
        console.log('🧹 All notification channels cleaned up');
    }
    /**
     * 알림 수신 핸들러
     * 클라이언트 측에서 오버라이드하여 UI 알림 표시
     */
    handleNotificationReceived(userId, payload) {
        console.log(`📨 Notification received for user ${userId.toString()}:`, payload);
        // 서버 환경에서는 브라우저 알림을 사용할 수 없음
        // 클라이언트 측에서 이 핸들러를 오버라이드하여 UI 알림 처리
    }
    /**
     * 채널 상태 변화 핸들러
     * 연결 끊김 시 자동 재연결 시도
     */
    async handleChannelStatusChange(channelId, payload) {
        console.log(`🔄 Channel ${channelId} status changed:`, payload);
        // 연결 끊김 감지 시 재연결 시도
        if (payload.type === 'system' && payload.event === 'phx_error') {
            const attempts = this.reconnectAttempts.get(channelId) || 0;
            if (attempts < this.maxReconnectAttempts) {
                console.log(`🔄 Attempting to reconnect channel ${channelId} (attempt ${attempts + 1})`);
                this.reconnectAttempts.set(channelId, attempts + 1);
                // 지수 백오프로 재연결 시도
                const delay = Math.pow(2, attempts) * 1000;
                setTimeout(async () => {
                    await this.reconnectChannel(channelId);
                }, delay);
            }
            else {
                console.error(`❌ Max reconnection attempts reached for channel ${channelId}`);
                this.activeChannels.delete(channelId);
                this.reconnectAttempts.delete(channelId);
            }
        }
    }
    /**
     * 채널 재연결
     */
    async reconnectChannel(channelId) {
        try {
            // 기존 채널 정리
            const oldChannel = this.activeChannels.get(channelId);
            if (oldChannel) {
                await oldChannel.unsubscribe();
            }
            // 사용자 ID 추출
            const userId = channelId.replace('notifications:', '');
            const userIdObj = new UniqueEntityID(userId);
            // 새 구독 시도
            const result = await this.subscribeToUserChannel(userIdObj);
            if (result.isSuccess) {
                console.log(`✅ Successfully reconnected channel ${channelId}`);
                this.reconnectAttempts.set(channelId, 0); // 성공 시 재시도 횟수 리셋
            }
            else {
                console.error(`❌ Failed to reconnect channel ${channelId}: ${result.error}`);
            }
        }
        catch (error) {
            console.error(`❌ Reconnection error for channel ${channelId}:`, error);
        }
    }
}
//# sourceMappingURL=SupabaseNotificationService.js.map