import { SupabaseClient } from '@supabase/supabase-js'
import { UniqueEntityID, Result } from '@woodie/domain'

interface NotificationRecord {
  id: string
  student_id: string
  type: 'review_due' | 'assignment_due' | 'achievement'
  priority: 'critical' | 'high' | 'medium' | 'low'
  delivery_method: 'push' | 'email' | 'in_app'
  status: 'pending' | 'sent' | 'failed' | 'cancelled'
  scheduled_at: string
  sent_at: string | null
  failure_reason: string | null
  title: string
  body: string
  metadata: any
  processing_time_ms: number | null
  created_at: string
  updated_at: string
}

interface NotificationSearchOptions {
  limit?: number
  priority?: string
  deliveryMethod?: string
  scheduledBefore?: Date
}

export interface INotificationRepository {
  findPendingNotifications(options: NotificationSearchOptions): Promise<Result<NotificationRecord[]>>
  countPendingNotifications(options: { scheduledBefore?: Date }): Promise<Result<number>>
  save(notification: NotificationRecord): Promise<Result<void>>
  findById(id: UniqueEntityID): Promise<Result<NotificationRecord | null>>
  updateStatus(id: UniqueEntityID, status: string, metadata?: any): Promise<Result<void>>
  findByStudentAndPeriod(studentId: UniqueEntityID, fromDate: Date, toDate: Date): Promise<Result<NotificationRecord[]>>
  findScheduledByStudentId(studentId: UniqueEntityID): Promise<Result<NotificationRecord[]>>
  findSentByStudentId(studentId: UniqueEntityID): Promise<Result<NotificationRecord[]>>
  delete(id: UniqueEntityID): Promise<Result<void>>
}

export class SupabaseNotificationRepository implements INotificationRepository {
  private supabase: SupabaseClient

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  async findPendingNotifications(options: NotificationSearchOptions): Promise<Result<NotificationRecord[]>> {
    try {
      let query = this.supabase
        .from('notifications')
        .select('*')
        .eq('status', 'pending')
        .order('priority', { ascending: false })
        .order('scheduled_at', { ascending: true })

      if (options.priority) {
        query = query.eq('priority', options.priority)
      }

      if (options.deliveryMethod) {
        query = query.eq('delivery_method', options.deliveryMethod)
      }

      if (options.scheduledBefore) {
        query = query.lte('scheduled_at', options.scheduledBefore.toISOString())
      }

      if (options.limit) {
        query = query.limit(options.limit)
      }

      const { data, error } = await query

      if (error) {
        return Result.fail<NotificationRecord[]>(`Failed to find pending notifications: ${error.message}`)
      }

      return Result.ok<NotificationRecord[]>(data || [])
    } catch (error) {
      return Result.fail<NotificationRecord[]>(`Unexpected error finding pending notifications: ${error}`)
    }
  }

  async countPendingNotifications(options: { scheduledBefore?: Date }): Promise<Result<number>> {
    try {
      let query = this.supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending')

      if (options.scheduledBefore) {
        query = query.lte('scheduled_at', options.scheduledBefore.toISOString())
      }

      const { count, error } = await query

      if (error) {
        return Result.fail<number>(`Failed to count pending notifications: ${error.message}`)
      }

      return Result.ok<number>(count || 0)
    } catch (error) {
      return Result.fail<number>(`Unexpected error counting pending notifications: ${error}`)
    }
  }

  async save(notification: NotificationRecord): Promise<Result<void>> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .upsert(notification)

      if (error) {
        return Result.fail<void>(`Failed to save notification: ${error.message}`)
      }

      return Result.ok<void>()
    } catch (error) {
      return Result.fail<void>(`Unexpected error saving notification: ${error}`)
    }
  }

  async findById(id: UniqueEntityID): Promise<Result<NotificationRecord | null>> {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .select('*')
        .eq('id', id.toString())
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        return Result.fail<NotificationRecord | null>(`Failed to find notification: ${error.message}`)
      }

      return Result.ok<NotificationRecord | null>(data || null)
    } catch (error) {
      return Result.fail<NotificationRecord | null>(`Unexpected error finding notification: ${error}`)
    }
  }

  async updateStatus(id: UniqueEntityID, status: string, metadata?: any): Promise<Result<void>> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      }

      if (status === 'sent') {
        updateData.sent_at = new Date().toISOString()
      }

      if (metadata) {
        if (metadata.failureReason) {
          updateData.failure_reason = metadata.failureReason
        }
        if (metadata.processingTimeMs) {
          updateData.processing_time_ms = metadata.processingTimeMs
        }
      }

      const { error } = await this.supabase
        .from('notifications')
        .update(updateData)
        .eq('id', id.toString())

      if (error) {
        return Result.fail<void>(`Failed to update notification status: ${error.message}`)
      }

      return Result.ok<void>()
    } catch (error) {
      return Result.fail<void>(`Unexpected error updating notification status: ${error}`)
    }
  }

  // 통계를 위한 추가 메서드들
  async findRecentNotifications(days: number = 7): Promise<Result<NotificationRecord[]>> {
    try {
      const since = new Date()
      since.setDate(since.getDate() - days)

      const { data, error } = await this.supabase
        .from('notifications')
        .select('*')
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false })

      if (error) {
        return Result.fail<NotificationRecord[]>(`Failed to find recent notifications: ${error.message}`)
      }

      return Result.ok<NotificationRecord[]>(data || [])
    } catch (error) {
      return Result.fail<NotificationRecord[]>(`Unexpected error finding recent notifications: ${error}`)
    }
  }

  async findByStudentAndPeriod(
    studentId: UniqueEntityID, 
    fromDate: Date, 
    toDate: Date
  ): Promise<Result<NotificationRecord[]>> {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .select('*')
        .eq('student_id', studentId.toString())
        .gte('created_at', fromDate.toISOString())
        .lte('created_at', toDate.toISOString())
        .order('created_at', { ascending: false })

      if (error) {
        return Result.fail<NotificationRecord[]>(`Failed to find notifications by student and period: ${error.message}`)
      }

      return Result.ok<NotificationRecord[]>(data || [])
    } catch (error) {
      return Result.fail<NotificationRecord[]>(`Unexpected error finding notifications by student and period: ${error}`)
    }
  }

  async findScheduledByStudentId(studentId: UniqueEntityID): Promise<Result<NotificationRecord[]>> {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .select('*')
        .eq('student_id', studentId.toString())
        .eq('status', 'pending')
        .order('scheduled_at', { ascending: true })

      if (error) {
        return Result.fail<NotificationRecord[]>(`Failed to find scheduled notifications: ${error.message}`)
      }

      return Result.ok<NotificationRecord[]>(data || [])
    } catch (error) {
      return Result.fail<NotificationRecord[]>(`Unexpected error finding scheduled notifications: ${error}`)
    }
  }

  async findSentByStudentId(studentId: UniqueEntityID): Promise<Result<NotificationRecord[]>> {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .select('*')
        .eq('student_id', studentId.toString())
        .eq('status', 'sent')
        .order('sent_at', { ascending: false })

      if (error) {
        return Result.fail<NotificationRecord[]>(`Failed to find sent notifications: ${error.message}`)
      }

      return Result.ok<NotificationRecord[]>(data || [])
    } catch (error) {
      return Result.fail<NotificationRecord[]>(`Unexpected error finding sent notifications: ${error}`)
    }
  }

  async delete(id: UniqueEntityID): Promise<Result<void>> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .delete()
        .eq('id', id.toString())

      if (error) {
        return Result.fail<void>(`Failed to delete notification: ${error.message}`)
      }

      return Result.ok<void>()
    } catch (error) {
      return Result.fail<void>(`Unexpected error deleting notification: ${error}`)
    }
  }

  async getDeliveryStats(days: number = 7): Promise<Result<any>> {
    try {
      const since = new Date()
      since.setDate(since.getDate() - days)

      const { data, error } = await this.supabase
        .from('notifications')
        .select('status, delivery_method, type, processing_time_ms')
        .gte('created_at', since.toISOString())

      if (error) {
        return Result.fail<any>(`Failed to get delivery stats: ${error.message}`)
      }

      // 통계 계산
      const stats = {
        total: data?.length || 0,
        sent: data?.filter((n: any) => n.status === 'sent').length || 0,
        failed: data?.filter((n: any) => n.status === 'failed').length || 0,
        pending: data?.filter((n: any) => n.status === 'pending').length || 0,
        byDeliveryMethod: {} as Record<string, any>,
        byType: {} as Record<string, any>,
        avgProcessingTimeMs: 0
      }

      if (data && data.length > 0) {
        // 전송 방법별 통계
        const deliveryMethods = ['push', 'email', 'in_app']
        deliveryMethods.forEach(method => {
          const methodData = data.filter((n: any) => n.delivery_method === method)
          stats.byDeliveryMethod[method] = {
            total: methodData.length,
            sent: methodData.filter((n: any) => n.status === 'sent').length,
            failed: methodData.filter((n: any) => n.status === 'failed').length,
            successRate: methodData.length > 0 ? 
              (methodData.filter((n: any) => n.status === 'sent').length / methodData.length * 100).toFixed(1) : '0'
          }
        })

        // 타입별 통계
        const types = ['review_due', 'assignment_due', 'achievement']
        types.forEach(type => {
          const typeData = data.filter((n: any) => n.type === type)
          stats.byType[type] = {
            total: typeData.length,
            sent: typeData.filter((n: any) => n.status === 'sent').length,
            failed: typeData.filter((n: any) => n.status === 'failed').length
          }
        })

        // 평균 처리 시간
        const processingTimes = data
          .filter((n: any) => n.processing_time_ms !== null && n.status === 'sent')
          .map((n: any) => n.processing_time_ms || 0)
        
        if (processingTimes.length > 0) {
          stats.avgProcessingTimeMs = processingTimes.reduce((sum: number, time: number) => sum + time, 0) / processingTimes.length
        }
      }

      return Result.ok<any>(stats)
    } catch (error) {
      return Result.fail<any>(`Unexpected error getting delivery stats: ${error}`)
    }
  }
}