import { UniqueEntityID } from '@woodie/domain/common/Identifier'
import { INotificationSettingsRepository } from '@woodie/domain/srs/interfaces/INotificationService'
import { NotificationSettings } from '@woodie/domain/srs/value-objects/NotificationSettings'

interface NotificationSettingsRow {
  user_id: string
  enabled: boolean
  review_reminders: boolean
  overdue_reminders: boolean
  daily_summary: boolean
  milestone_alerts: boolean
  quiet_hours_start: string
  quiet_hours_end: string
  timezone: string
  created_at: string
  updated_at: string
}

/**
 * Supabase 기반 알림 설정 리포지토리 구현체
 * 사용자별 알림 선호도와 설정을 영구 저장
 */
export class SupabaseNotificationSettingsRepository implements INotificationSettingsRepository {
  protected client: any
  private readonly tableName = 'notification_settings'
  private readonly schema = 'learning'

  constructor(client: any) {
    this.client = client
  }


  /**
   * 사용자 알림 설정 조회
   */
  async findByUserId(userId: UniqueEntityID): Promise<NotificationSettings | null> {
    try {
      const { data, error } = await this.client
        .from(`${this.schema}.${this.tableName}`)
        .select('*')
        .eq('user_id', userId.toString())
        .single()

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          return null
        }
        throw new Error(`Failed to find notification settings: ${error.message}`)
      }

      if (!data) return null

      return this.toDomain(data)

    } catch (error) {
      console.error(`Error finding notification settings for user ${userId.toString()}:`, error)
      return null
    }
  }

  /**
   * INotificationSettingsRepository save 구현
   */
  async save(userId: UniqueEntityID, settings: NotificationSettings): Promise<void> {
    return this.saveUserSettings(userId, settings)
  }

  /**
   * 알림 설정 저장 (생성 또는 업데이트)
   */
  async saveUserSettings(userId: UniqueEntityID, settings: NotificationSettings): Promise<void> {
    try {
      const persistence = this.toPersistence(userId, settings)

      const { error } = await this.client
        .from(`${this.schema}.${this.tableName}`)
        .upsert(persistence, {
          onConflict: 'user_id',
          returning: 'minimal'
        })

      if (error) {
        throw new Error(`Failed to save notification settings: ${error.message}`)
      }

      console.log(`✅ Saved notification settings for user: ${userId.toString()}`)

    } catch (error) {
      console.error(`Error saving notification settings:`, error)
      throw error
    }
  }

  /**
   * INotificationSettingsRepository delete 구현
   */
  async delete(userId: UniqueEntityID): Promise<void> {
    return this.deleteUserSettings(userId)
  }

  /**
   * 알림 설정 삭제
   */
  async deleteUserSettings(userId: UniqueEntityID): Promise<void> {
    try {
      const { error } = await this.client
        .from(`${this.schema}.${this.tableName}`)
        .delete()
        .eq('user_id', userId.toString())

      if (error) {
        throw new Error(`Failed to delete notification settings: ${error.message}`)
      }

      console.log(`🗑️ Deleted notification settings for user: ${userId.toString()}`)

    } catch (error) {
      console.error(`Error deleting notification settings:`, error)
      throw error
    }
  }

  /**
   * 특정 알림 타입이 활성화된 사용자 목록 조회
   * 배치 알림 전송 시 사용
   */
  async findUsersWithEnabledNotification(type: 'review' | 'overdue' | 'summary' | 'milestone'): Promise<UniqueEntityID[]> {
    try {
      let query = this.client
        .from(`${this.schema}.${this.tableName}`)
        .select('user_id')
        .eq('enabled', true)

      // 알림 타입별 추가 필터링
      switch (type) {
        case 'review':
          query = query.eq('review_reminders', true)
          break
        case 'overdue':
          query = query.eq('overdue_reminders', true)
          break
        case 'summary':
          query = query.eq('daily_summary', true)
          break
        case 'milestone':
          query = query.eq('milestone_alerts', true)
          break
      }

      const { data, error } = await query

      if (error) {
        throw new Error(`Failed to find users with enabled ${type} notifications: ${error.message}`)
      }

      return (data || []).map((row: any) => new UniqueEntityID(row.user_id))

    } catch (error) {
      console.error(`Error finding users with enabled ${type} notifications:`, error)
      return []
    }
  }

  /**
   * 도메인 객체를 데이터베이스 행으로 변환
   */
  private toPersistence(userId: UniqueEntityID, settings: NotificationSettings): Record<string, any> {
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
    }
  }

  /**
   * 데이터베이스 행을 도메인 객체로 변환
   */
  private toDomain(row: NotificationSettingsRow): NotificationSettings {
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
    })

    if (result.isFailure) {
      throw new Error(`Invalid notification settings data: ${result.error}`)
    }

    return result.getValue()
  }
}