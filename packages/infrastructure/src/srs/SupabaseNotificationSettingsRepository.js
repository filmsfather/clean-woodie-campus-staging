import { UniqueEntityID } from '@domain/common/Identifier';
import { NotificationSettings } from '@domain/srs/value-objects/NotificationSettings';
import { BaseRepository } from '../repositories/BaseRepository';
/**
 * Supabase 기반 알림 설정 리포지토리 구현체
 * 사용자별 알림 선호도와 설정을 영구 저장
 */
export class SupabaseNotificationSettingsRepository extends BaseRepository {
    tableName = 'notification_settings';
    schema = 'learning';
    /**
     * 사용자 알림 설정 조회
     */
    async findByUserId(userId) {
        try {
            const { data, error } = await this.client
                .from(`${this.schema}.${this.tableName}`)
                .select('*')
                .eq('user_id', userId.toString())
                .single();
            if (error) {
                if (error.code === 'PGRST116') { // No rows returned
                    return null;
                }
                throw new Error(`Failed to find notification settings: ${error.message}`);
            }
            if (!data)
                return null;
            return this.toDomain(data);
        }
        catch (error) {
            console.error(`Error finding notification settings for user ${userId.toString()}:`, error);
            return null;
        }
    }
    /**
     * 알림 설정 저장 (생성 또는 업데이트)
     */
    async save(userId, settings) {
        try {
            const persistence = this.toPersistence(userId, settings);
            const { error } = await this.client
                .from(`${this.schema}.${this.tableName}`)
                .upsert(persistence, {
                onConflict: 'user_id',
                returning: 'minimal'
            });
            if (error) {
                throw new Error(`Failed to save notification settings: ${error.message}`);
            }
            console.log(`✅ Saved notification settings for user: ${userId.toString()}`);
        }
        catch (error) {
            console.error(`Error saving notification settings:`, error);
            throw error;
        }
    }
    /**
     * 알림 설정 삭제
     */
    async delete(userId) {
        try {
            const { error } = await this.client
                .from(`${this.schema}.${this.tableName}`)
                .delete()
                .eq('user_id', userId.toString());
            if (error) {
                throw new Error(`Failed to delete notification settings: ${error.message}`);
            }
            console.log(`🗑️ Deleted notification settings for user: ${userId.toString()}`);
        }
        catch (error) {
            console.error(`Error deleting notification settings:`, error);
            throw error;
        }
    }
    /**
     * 특정 알림 타입이 활성화된 사용자 목록 조회
     * 배치 알림 전송 시 사용
     */
    async findUsersWithEnabledNotification(type) {
        try {
            let query = this.client
                .from(`${this.schema}.${this.tableName}`)
                .select('user_id')
                .eq('enabled', true);
            // 알림 타입별 추가 필터링
            switch (type) {
                case 'review':
                    query = query.eq('review_reminders', true);
                    break;
                case 'overdue':
                    query = query.eq('overdue_reminders', true);
                    break;
                case 'summary':
                    query = query.eq('daily_summary', true);
                    break;
                case 'milestone':
                    query = query.eq('milestone_alerts', true);
                    break;
            }
            const { data, error } = await query;
            if (error) {
                throw new Error(`Failed to find users with enabled ${type} notifications: ${error.message}`);
            }
            return (data || []).map(row => new UniqueEntityID(row.user_id));
        }
        catch (error) {
            console.error(`Error finding users with enabled ${type} notifications:`, error);
            return [];
        }
    }
    /**
     * 도메인 객체를 데이터베이스 행으로 변환
     */
    toPersistence(userId, settings) {
        return {
            user_id: userId.toString(),
            enabled: settings.enabled,
            review_reminders: settings.reviewReminders,
            overdue_reminders: settings.overdueReminders,
            daily_summary: settings.dailySummary,
            milestone_alerts: settings.milestoneAlerts,
            quiet_hours_start: settings.quietHours.start,
            quiet_hours_end: settings.quietHours.end,
            timezone: settings.timezone,
            updated_at: new Date().toISOString()
        };
    }
    /**
     * 데이터베이스 행을 도메인 객체로 변환
     */
    toDomain(row) {
        const result = NotificationSettings.create({
            enabled: row.enabled,
            reviewReminders: row.review_reminders,
            overdueReminders: row.overdue_reminders,
            dailySummary: row.daily_summary,
            milestoneAlerts: row.milestone_alerts,
            quietHours: {
                start: row.quiet_hours_start,
                end: row.quiet_hours_end
            },
            timezone: row.timezone
        });
        if (result.isFailure) {
            throw new Error(`Invalid notification settings data: ${result.error}`);
        }
        return result.getValue();
    }
}
//# sourceMappingURL=SupabaseNotificationSettingsRepository.js.map