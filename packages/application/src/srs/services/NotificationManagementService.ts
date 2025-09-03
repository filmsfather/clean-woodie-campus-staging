import { UniqueEntityID } from '@domain/common/Identifier'
import { Result } from '@domain/common/Result'
import { IClock } from '@domain/srs'
import { 
  INotificationService,
  INotificationSettingsRepository,
  INotificationHistoryRepository,
  NotificationMessage,
  ChannelSubscription
} from '@domain/srs/interfaces/INotificationService'
import { NotificationType } from '@domain/srs/value-objects/NotificationType'
import { NotificationSettings } from '@domain/srs/value-objects/NotificationSettings'

// 알림 예약 요청 DTO
export interface ScheduleNotificationRequest {
  recipientId: string
  type: NotificationType
  scheduledFor: Date
  title: string
  body: string
  data?: Record<string, any>
}

// 알림 통계 DTO  
export interface NotificationStatistics {
  totalSent: number
  successRate: number
  averageDeliveryTime: number
  notificationsByType: Record<string, number>
  activeSubscriptions: number
  recentFailures: number
}

/**
 * 알림 관리 서비스 (Application Layer)
 * 도메인 인터페이스들을 조합하여 알림 관련 유스케이스 구현
 * Infrastructure 레이어와는 인터페이스를 통해서만 소통
 */
export class NotificationManagementService {
  constructor(
    private notificationService: INotificationService,           // Supabase Realtime 구현체
    private settingsRepository: INotificationSettingsRepository, // 설정 저장소
    private historyRepository: INotificationHistoryRepository,   // 이력 저장소
    private clock: IClock                                       // 시간 서비스
  ) {}

  /**
   * 사용자 알림 채널 초기화
   * 로그인 시 또는 앱 시작 시 호출
   */
  async initializeUserNotifications(userId: UniqueEntityID): Promise<Result<ChannelSubscription>> {
    try {
      // 1. 사용자 알림 설정 조회 또는 기본값 생성
      let settings = await this.settingsRepository.findByUserId(userId)
      if (!settings) {
        settings = NotificationSettings.createDefault()
        await this.settingsRepository.save(userId, settings)
      }

      // 2. 알림이 비활성화된 경우 구독하지 않음
      if (!settings.enabled) {
        return Result.fail<ChannelSubscription>('Notifications are disabled for this user')
      }

      // 3. 실시간 채널 구독
      const subscriptionResult = await this.notificationService.subscribeToUserChannel(userId)
      if (subscriptionResult.isFailure) {
        return Result.fail<ChannelSubscription>(subscriptionResult.error)
      }

      return Result.ok<ChannelSubscription>(subscriptionResult.getValue())

    } catch (error) {
      return Result.fail<ChannelSubscription>(`Failed to initialize user notifications: ${error}`)
    }
  }

  /**
   * 즉시 알림 전송
   * 긴급 알림이나 실시간 피드백 시 사용
   */
  async sendImmediateNotification(
    recipientId: UniqueEntityID,
    type: NotificationType,
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<Result<void>> {
    try {
      // 1. 사용자 알림 설정 확인
      const settings = await this.settingsRepository.findByUserId(recipientId)
      if (!settings || !settings.enabled) {
        return Result.fail<void>('User has notifications disabled')
      }

      // 2. 알림 타입별 설정 확인
      const category = type.getCategory()
      if (!settings.isNotificationTypeEnabled(category)) {
        return Result.fail<void>(`User has disabled ${category} notifications`)
      }

      // 3. 조용한 시간 확인 (긴급 알림 제외)
      if (!type.isUrgent() && settings.isQuietTime(this.clock.now())) {
        return Result.fail<void>('Current time is within user quiet hours')
      }

      // 4. 알림 메시지 생성
      const message: NotificationMessage = {
        id: this.generateNotificationId(),
        recipientId: recipientId.toString(),
        type,
        title,
        body,
        data,
        scheduledAt: this.clock.now(),
        sentAt: undefined // 전송 후 업데이트
      }

      // 5. 이력 저장 (전송 전)
      await this.historyRepository.saveNotification(message)

      // 6. 실시간 전송
      const sendResult = await this.notificationService.sendNotification(message)
      if (sendResult.isFailure) {
        return Result.fail<void>(sendResult.error)
      }

      // 7. 전송 완료 마킹
      await this.historyRepository.markAsSent(message.id, this.clock.now())

      return Result.ok<void>()

    } catch (error) {
      return Result.fail<void>(`Failed to send immediate notification: ${error}`)
    }
  }

  /**
   * 예약 알림 전송 (배치)
   * 스케줄러나 백그라운드 작업에서 호출
   */
  async sendScheduledNotifications(requests: ScheduleNotificationRequest[]): Promise<Result<number>> {
    try {
      let successCount = 0
      const messages: NotificationMessage[] = []

      // 1. 각 요청을 알림 메시지로 변환
      for (const request of requests) {
        const userId = new UniqueEntityID(request.recipientId)
        
        // 사용자별 알림 설정 확인
        const settings = await this.settingsRepository.findByUserId(userId)
        if (!settings || !settings.enabled) continue

        const category = request.type.getCategory()
        if (!settings.isNotificationTypeEnabled(category)) continue

        // 조용한 시간 확인 (긴급 알림 제외)
        if (!request.type.isUrgent() && settings.isQuietTime(request.scheduledFor)) continue

        // 알림 메시지 생성
        const message: NotificationMessage = {
          id: this.generateNotificationId(),
          recipientId: request.recipientId,
          type: request.type,
          title: request.title,
          body: request.body,
          data: request.data,
          scheduledAt: request.scheduledFor,
          sentAt: undefined
        }

        messages.push(message)
      }

      // 2. 이력 저장 (배치)
      for (const message of messages) {
        await this.historyRepository.saveNotification(message)
      }

      // 3. 배치 전송
      if (messages.length > 0) {
        const batchResult = await this.notificationService.sendBatchNotifications(messages)
        if (batchResult.isSuccess) {
          // 전송 완료 마킹
          const sentAt = this.clock.now()
          for (const message of messages) {
            await this.historyRepository.markAsSent(message.id, sentAt)
          }
          successCount = messages.length
        }
      }

      return Result.ok<number>(successCount)

    } catch (error) {
      return Result.fail<number>(`Failed to send scheduled notifications: ${error}`)
    }
  }

  /**
   * 사용자 알림 설정 업데이트
   */
  async updateNotificationSettings(
    userId: UniqueEntityID,
    updates: Partial<{
      enabled: boolean
      reviewReminders: boolean
      overdueReminders: boolean
      dailySummary: boolean
      milestoneAlerts: boolean
      quietHours: { start: string; end: string }
      timezone: string
    }>
  ): Promise<Result<NotificationSettings>> {
    try {
      // 1. 기존 설정 조회
      let currentSettings = await this.settingsRepository.findByUserId(userId)
      if (!currentSettings) {
        currentSettings = NotificationSettings.createDefault()
      }

      // 2. 설정 업데이트
      const updateResult = currentSettings.updateSettings(updates)
      if (updateResult.isFailure) {
        return Result.fail<NotificationSettings>(updateResult.error)
      }

      const newSettings = updateResult.getValue()

      // 3. 저장
      await this.settingsRepository.save(userId, newSettings)

      return Result.ok<NotificationSettings>(newSettings)

    } catch (error) {
      return Result.fail<NotificationSettings>(`Failed to update notification settings: ${error}`)
    }
  }

  /**
   * 사용자 알림 통계 조회
   */
  async getNotificationStatistics(userId: UniqueEntityID): Promise<Result<NotificationStatistics>> {
    try {
      const thirtyDaysAgo = new Date(this.clock.now())
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      // 1. 최근 알림 이력 조회
      const recentNotifications = await this.historyRepository.findByUserId(userId, 1000)
      
      // 2. 활성 구독 정보 조회
      const subscriptionsResult = await this.notificationService.getActiveSubscriptions(userId)
      const activeSubscriptions = subscriptionsResult.isSuccess ? 
        subscriptionsResult.getValue().length : 0

      // 3. 통계 계산
      const sentNotifications = recentNotifications.filter(n => n.sentAt)
      const failedNotifications = recentNotifications.filter(n => !n.sentAt)

      const statistics: NotificationStatistics = {
        totalSent: sentNotifications.length,
        successRate: recentNotifications.length > 0 ? 
          (sentNotifications.length / recentNotifications.length) * 100 : 0,
        averageDeliveryTime: this.calculateAverageDeliveryTime(sentNotifications),
        notificationsByType: this.groupNotificationsByType(recentNotifications),
        activeSubscriptions,
        recentFailures: failedNotifications.length
      }

      return Result.ok<NotificationStatistics>(statistics)

    } catch (error) {
      return Result.fail<NotificationStatistics>(`Failed to get notification statistics: ${error}`)
    }
  }

  /**
   * 알림 채널 정리 (로그아웃 시)
   */
  async cleanupUserNotifications(userId: UniqueEntityID): Promise<Result<void>> {
    try {
      const subscriptionsResult = await this.notificationService.getActiveSubscriptions(userId)
      if (subscriptionsResult.isSuccess) {
        const subscriptions = subscriptionsResult.getValue()
        
        for (const subscription of subscriptions) {
          await this.notificationService.unsubscribeFromChannel(subscription.channelId)
        }
      }

      return Result.ok<void>()

    } catch (error) {
      return Result.fail<void>(`Failed to cleanup user notifications: ${error}`)
    }
  }

  /**
   * 고유한 알림 ID 생성
   */
  private generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 평균 전송 시간 계산 (밀리초)
   */
  private calculateAverageDeliveryTime(notifications: NotificationMessage[]): number {
    const deliveryTimes = notifications
      .filter(n => n.sentAt && n.scheduledAt)
      .map(n => n.sentAt!.getTime() - n.scheduledAt.getTime())

    if (deliveryTimes.length === 0) return 0

    return deliveryTimes.reduce((sum, time) => sum + time, 0) / deliveryTimes.length
  }

  /**
   * 알림 타입별 그룹화
   */
  private groupNotificationsByType(notifications: NotificationMessage[]): Record<string, number> {
    const grouping: Record<string, number> = {}

    for (const notification of notifications) {
      const type = notification.type.value
      grouping[type] = (grouping[type] || 0) + 1
    }

    return grouping
  }
}