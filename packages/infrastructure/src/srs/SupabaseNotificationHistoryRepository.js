import { NotificationType } from '@woodie/domain/srs/value-objects/NotificationType';
import { BaseRepository } from '../repositories/BaseRepository';
/**
 * Supabase 기반 알림 이력 리포지토리 구현체
 * 알림 전송 이력, 실패 기록, 재시도 정보 관리
 */
export class SupabaseNotificationHistoryRepository extends BaseRepository {
    client;
    tableName = 'notification_history';
    schema = 'learning';
    constructor(client) {
        super();
        this.client = client;
    }
    // BaseRepository abstract 메서드들 구현
    async findById(id) {
        // NotificationMessage는 ID 기반 조회보다는 사용자별 조회가 일반적
        // 임시로 null 반환, 필요 시 구체적인 구현 추가
        console.warn('findById not implemented for NotificationHistoryRepository');
        return null;
    }
    async save(entity) {
        return this.saveNotification(entity);
    }
    async delete(id) {
        // 필요 시 구현
        console.warn('delete not implemented for NotificationHistoryRepository');
    }
    /**
     * 알림 전송 이력 저장
     */
    async saveNotification(message) {
        try {
            const persistence = this.toPersistence(message);
            const { error } = await this.client
                .from(`${this.schema}.${this.tableName}`)
                .insert(persistence);
            if (error) {
                throw new Error(`Failed to save notification history: ${error.message}`);
            }
        }
        catch (error) {
            console.error('Error saving notification history:', error);
            throw error;
        }
    }
    /**
     * 사용자별 알림 이력 조회 (최근 순)
     */
    async findByUserId(userId, limit = 50) {
        try {
            const { data, error } = await this.client
                .from(`${this.schema}.${this.tableName}`)
                .select('*')
                .eq('recipient_id', userId.toString())
                .order('created_at', { ascending: false })
                .limit(limit);
            if (error || !data) {
                console.warn(`Failed to find notification history for user ${userId.toString()}:`, error);
                return [];
            }
            return data.map((row) => this.toDomain(row));
        }
        catch (error) {
            console.error(`Error finding notification history for user ${userId.toString()}:`, error);
            return [];
        }
    }
    /**
     * 전송 실패한 알림 조회 (재시도용)
     */
    async findFailedNotifications(limit = 100) {
        try {
            const { data, error } = await this.client
                .from(`${this.schema}.${this.tableName}`)
                .select('*')
                .is('sent_at', null)
                .not('failed_at', 'is', null)
                .lt('retry_count', 3) // 3번 미만 재시도한 것만
                .order('failed_at', { ascending: true })
                .limit(limit);
            if (error || !data) {
                console.warn('Failed to find failed notifications:', error);
                return [];
            }
            return data.map((row) => this.toDomain(row));
        }
        catch (error) {
            console.error('Error finding failed notifications:', error);
            return [];
        }
    }
    /**
     * 알림 상태 업데이트 (전송 완료)
     */
    async markAsSent(notificationId, sentAt) {
        try {
            const { error } = await this.client
                .from(`${this.schema}.${this.tableName}`)
                .update({
                sent_at: sentAt.toISOString(),
                failed_at: null, // 성공 시 실패 기록 클리어
                failure_reason: null
            })
                .eq('id', notificationId);
            if (error) {
                throw new Error(`Failed to mark notification as sent: ${error.message}`);
            }
        }
        catch (error) {
            console.error(`Error marking notification ${notificationId} as sent:`, error);
            throw error;
        }
    }
    /**
     * 알림 전송 실패 기록
     */
    async markAsFailed(notificationId, failureReason) {
        try {
            const { error } = await this.client
                .from(`${this.schema}.${this.tableName}`)
                .update({
                failed_at: new Date().toISOString(),
                failure_reason: failureReason
            })
                .eq('id', notificationId);
            if (error) {
                throw new Error(`Failed to mark notification as failed: ${error.message}`);
            }
        }
        catch (error) {
            console.error(`Error marking notification ${notificationId} as failed:`, error);
            throw error;
        }
    }
    /**
     * 재시도 횟수 증가
     */
    async incrementRetryCount(notificationId) {
        try {
            const { error } = await this.client
                .rpc('increment_notification_retry', {
                notification_id: notificationId
            });
            if (error) {
                // RPC 함수가 없다면 일반 쿼리로 폴백
                const { error: updateError } = await this.client
                    .from(`${this.schema}.${this.tableName}`)
                    .update({
                    retry_count: this.client.raw('retry_count + 1')
                })
                    .eq('id', notificationId);
                if (updateError) {
                    throw new Error(`Failed to increment retry count: ${updateError.message}`);
                }
            }
        }
        catch (error) {
            console.error(`Error incrementing retry count for notification ${notificationId}:`, error);
            throw error;
        }
    }
    /**
     * 오래된 알림 이력 삭제 (데이터 정리용)
     * 일반적으로 6개월 이상 된 데이터를 삭제
     */
    async deleteOldNotifications(olderThan) {
        try {
            const { error } = await this.client
                .from(`${this.schema}.${this.tableName}`)
                .delete()
                .lt('created_at', olderThan.toISOString());
            if (error) {
                throw new Error(`Failed to delete old notifications: ${error.message}`);
            }
            console.log(`🧹 Deleted old notification history before ${olderThan.toISOString()}`);
        }
        catch (error) {
            console.error('Error deleting old notifications:', error);
            throw error;
        }
    }
    /**
     * 날짜 범위별 알림 통계 조회
     */
    async getStatistics(startDate, endDate) {
        try {
            const { data, error } = await this.client
                .from(`${this.schema}.${this.tableName}`)
                .select('type, sent_at, failed_at, created_at')
                .gte('created_at', startDate.toISOString())
                .lte('created_at', endDate.toISOString());
            if (error || !data) {
                console.warn('Failed to get notification statistics:', error);
                return {
                    totalSent: 0,
                    totalFailed: 0,
                    byType: {},
                    byHour: {}
                };
            }
            const statistics = {
                totalSent: data.filter((row) => row.sent_at).length,
                totalFailed: data.filter((row) => row.failed_at).length,
                byType: {},
                byHour: {}
            };
            // 타입별 통계
            data.forEach((row) => {
                statistics.byType[row.type] = (statistics.byType[row.type] || 0) + 1;
            });
            // 시간대별 통계
            data.forEach((row) => {
                const hour = new Date(row.created_at).getHours();
                statistics.byHour[hour] = (statistics.byHour[hour] || 0) + 1;
            });
            return statistics;
        }
        catch (error) {
            console.error('Error getting notification statistics:', error);
            return {
                totalSent: 0,
                totalFailed: 0,
                byType: {},
                byHour: {}
            };
        }
    }
    /**
     * 도메인 객체를 데이터베이스 행으로 변환
     */
    toPersistence(message) {
        return {
            id: message.id,
            recipient_id: message.recipientId,
            type: message.type.value,
            title: message.title,
            body: message.body,
            data: message.data ? JSON.stringify(message.data) : null,
            scheduled_at: message.scheduledAt.toISOString(),
            sent_at: message.sentAt?.toISOString() || null,
            retry_count: 0,
            created_at: new Date().toISOString()
        };
    }
    /**
     * 데이터베이스 행을 도메인 객체로 변환
     */
    toDomain(row) {
        const typeResult = NotificationType.create(row.type);
        if (typeResult.isFailure) {
            throw new Error(`Invalid notification type: ${row.type}`);
        }
        return {
            id: row.id,
            recipientId: row.recipient_id,
            type: typeResult.getValue(),
            title: row.title,
            body: row.body,
            data: row.data ? JSON.parse(row.data) : undefined,
            scheduledAt: new Date(row.scheduled_at),
            sentAt: row.sent_at ? new Date(row.sent_at) : undefined
        };
    }
}
//# sourceMappingURL=SupabaseNotificationHistoryRepository.js.map