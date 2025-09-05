import { Request, Response } from 'express'
import { 
  GetNotificationStatusUseCase,
  GetNotificationStatusRequest 
} from '@woodie/application/srs/use-cases/GetNotificationStatusUseCase'
import { 
  ManageNotificationSettingsUseCase,
  ManageNotificationSettingsRequest 
} from '@woodie/application/srs/use-cases/ManageNotificationSettingsUseCase'
import { 
  ProcessNotificationQueueUseCase,
  ProcessNotificationQueueRequest 
} from '@woodie/application/srs/use-cases/ProcessNotificationQueueUseCase'
import { 
  TriggerOverdueNotificationUseCase,
  TriggerOverdueNotificationRequest 
} from '@woodie/application/srs/use-cases/TriggerOverdueNotificationUseCase'
import { BaseController } from '../../common/BaseController'

/**
 * SRS 알림 관리 API 컨트롤러
 * 
 * 책임:
 * - 알림 설정 관리 API 제공
 * - 알림 상태 조회 API 제공  
 * - 알림 큐 처리 API 제공
 * - 연체 알림 트리거 API 제공
 * 
 * DDD/Clean Architecture 원칙:
 * - Application Layer의 Use Case에만 의존
 * - 알림 로직은 Domain/Application Layer에 위임
 * - HTTP 관련 처리만 담당
 */
export class SRSNotificationController extends BaseController {
  constructor(
    private readonly getNotificationStatusUseCase: GetNotificationStatusUseCase,
    private readonly manageNotificationSettingsUseCase: ManageNotificationSettingsUseCase,
    private readonly processNotificationQueueUseCase: ProcessNotificationQueueUseCase,
    private readonly triggerOverdueNotificationUseCase: TriggerOverdueNotificationUseCase
  ) {
    super()
  }

  /**
   * GET /api/srs/notifications/status
   * 알림 발송 상태 조회
   */
  async getNotificationStatus(req: Request, res: Response): Promise<void> {
    try {
      const authenticatedUserId = this.getUserId(req)
      
      if (!authenticatedUserId) {
        this.unauthorized(res, 'Authentication required')
        return
      }

      const {
        includeScheduled = 'true',
        includeSent = 'false', 
        includeStatistics = 'true',
        timeRangeInDays = '7'
      } = req.query

      const request: GetNotificationStatusRequest = {
        studentId: authenticatedUserId,
        includeScheduled: this.parseBoolean(includeScheduled as string),
        includeSent: this.parseBoolean(includeSent as string),
        includeStatistics: this.parseBoolean(includeStatistics as string),
        timeRangeInDays: this.parsePositiveInteger(timeRangeInDays as string, 7, 90)
      }

      const result = await this.getNotificationStatusUseCase.execute(request)

      if (result.isFailure) {
        this.clientError(res, result.error)
        return
      }

      this.ok(res, result.getValue())

    } catch (error) {
      console.error('Error getting notification status:', error)
      this.fail(res, 'Failed to get notification status')
    }
  }

  /**
   * GET /api/srs/notifications/settings
   * 알림 설정 조회
   */
  async getNotificationSettings(req: Request, res: Response): Promise<void> {
    try {
      const authenticatedUserId = this.getUserId(req)
      
      if (!authenticatedUserId) {
        this.unauthorized(res, 'Authentication required')
        return
      }

      // 현재 설정 조회를 위한 상태 조회 (설정만 포함)
      const request: GetNotificationStatusRequest = {
        studentId: authenticatedUserId,
        includeScheduled: false,
        includeSent: false,
        includeStatistics: false,
        timeRangeInDays: 1
      }

      const result = await this.getNotificationStatusUseCase.execute(request)

      if (result.isFailure) {
        this.clientError(res, result.error)
        return
      }

      const statusData = result.getValue()

      // 설정 정보만 추출하여 반환
      this.ok(res, {
        settings: {
          // 실제 구현에서는 설정 정보를 포함한 응답 구조 필요
          message: 'Current notification settings',
          userId: authenticatedUserId,
          retrievedAt: statusData.retrievedAt
        }
      })

    } catch (error) {
      console.error('Error getting notification settings:', error)
      this.fail(res, 'Failed to get notification settings')
    }
  }

  /**
   * PUT /api/srs/notifications/settings
   * 알림 설정 업데이트
   */
  async updateNotificationSettings(req: Request, res: Response): Promise<void> {
    try {
      const authenticatedUserId = this.getUserId(req)
      
      if (!authenticatedUserId) {
        this.unauthorized(res, 'Authentication required')
        return
      }

      const {
        enableReviewReminders = true,
        enableOverdueAlerts = true,
        enableStreakNotifications = true,
        enableAchievementNotifications = true,
        reminderMinutesBefore = 60,
        overdueThresholdHours = 24,
        quietHoursStart,
        quietHoursEnd,
        preferredDeliveryMethods = ['push', 'in_app']
      } = req.body

      const request: ManageNotificationSettingsRequest = {
        studentId: authenticatedUserId,
        settings: {
          enableReviewReminders,
          enableOverdueAlerts,
          enableStreakNotifications,
          enableAchievementNotifications,
          reminderMinutesBefore,
          overdueThresholdHours,
          quietHoursStart,
          quietHoursEnd,
          preferredDeliveryMethods
        }
      }

      const result = await this.manageNotificationSettingsUseCase.execute(request)

      if (result.isFailure) {
        this.clientError(res, result.error)
        return
      }

      const settingsData = result.getValue()

      this.ok(res, {
        message: 'Notification settings updated successfully',
        settings: settingsData.settings,
        updatedAt: settingsData.updatedAt,
        validationWarnings: settingsData.validationWarnings,
        optimizationSuggestions: settingsData.optimizationSuggestions
      })

    } catch (error) {
      console.error('Error updating notification settings:', error)
      this.fail(res, 'Failed to update notification settings')
    }
  }

  /**
   * POST /api/srs/notifications/process-queue
   * 알림 큐 처리 (관리자용 또는 시스템 내부용)
   */
  async processNotificationQueue(req: Request, res: Response): Promise<void> {
    try {
      const authenticatedUserId = this.getUserId(req)
      
      if (!authenticatedUserId) {
        this.unauthorized(res, 'Authentication required')
        return
      }

      // 관리자 권한 확인
      if (!this.hasAdminRole(req)) {
        this.forbidden(res, 'Admin access required')
        return
      }

      const {
        batchSize = 50,
        priority = 'normal'
      } = req.body

      const request: ProcessNotificationQueueRequest = {
        batchSize: this.parsePositiveInteger(batchSize.toString(), 50, 200),
        priority: this.validatePriority(priority)
      }

      const result = await this.processNotificationQueueUseCase.execute(request)

      if (result.isFailure) {
        this.clientError(res, result.error)
        return
      }

      this.ok(res, result.getValue())

    } catch (error) {
      console.error('Error processing notification queue:', error)
      this.fail(res, 'Failed to process notification queue')
    }
  }

  /**
   * POST /api/srs/notifications/trigger-overdue
   * 연체 알림 트리거 (시스템 내부용)
   */
  async triggerOverdueNotification(req: Request, res: Response): Promise<void> {
    try {
      const authenticatedUserId = this.getUserId(req)
      
      if (!authenticatedUserId) {
        this.unauthorized(res, 'Authentication required')
        return
      }

      const { studentId } = req.body

      // 자신의 연체 알림이거나 관리자인 경우만 허용
      if (studentId !== authenticatedUserId && !this.hasAdminRole(req)) {
        this.forbidden(res, 'Access denied: insufficient permissions')
        return
      }

      const request: TriggerOverdueNotificationRequest = {
        studentId: studentId || authenticatedUserId
      }

      const result = await this.triggerOverdueNotificationUseCase.execute(request)

      if (result.isFailure) {
        this.clientError(res, result.error)
        return
      }

      this.ok(res, {
        message: 'Overdue notification triggered successfully',
        result: result.getValue()
      })

    } catch (error) {
      console.error('Error triggering overdue notification:', error)
      this.fail(res, 'Failed to trigger overdue notification')
    }
  }

  /**
   * POST /api/srs/notifications/test
   * 테스트 알림 전송 (개발용)
   */
  async sendTestNotification(req: Request, res: Response): Promise<void> {
    try {
      const authenticatedUserId = this.getUserId(req)
      
      if (!authenticatedUserId) {
        this.unauthorized(res, 'Authentication required')
        return
      }

      // 개발 환경에서만 허용
      if (process.env.NODE_ENV === 'production') {
        this.forbidden(res, 'Test notifications not allowed in production')
        return
      }

      const {
        type = 'review',
        title = 'Test Notification',
        message = 'This is a test notification from the SRS system.'
      } = req.body

      // 테스트 알림 트리거 (간단한 구현)
      const request: TriggerOverdueNotificationRequest = {
        studentId: authenticatedUserId
      }

      const result = await this.triggerOverdueNotificationUseCase.execute(request)

      if (result.isFailure) {
        this.clientError(res, result.error)
        return
      }

      this.ok(res, {
        message: 'Test notification sent successfully',
        testData: { type, title, message },
        result: result.getValue()
      })

    } catch (error) {
      console.error('Error sending test notification:', error)
      this.fail(res, 'Failed to send test notification')
    }
  }

  /**
   * 요청에서 사용자 ID 추출
   */
  private getUserId(req: Request): string | undefined {
    return (req as any).user?.id || req.headers['x-user-id'] as string
  }

  /**
   * 관리자 권한 검증
   */
  private hasAdminRole(req: Request): boolean {
    const userRole = (req as any).user?.role || req.headers['x-user-role'] as string
    return userRole === 'admin'
  }

  /**
   * 우선순위 값 검증
   */
  private validatePriority(priority: string): 'low' | 'medium' | 'high' | 'critical' {
    const validPriorities: ('low' | 'medium' | 'high' | 'critical')[] = ['low', 'medium', 'high', 'critical']
    
    // 기존 값 매핑
    if (priority === 'normal') return 'medium'
    if (priority === 'urgent') return 'critical'
    
    if (validPriorities.includes(priority as any)) {
      return priority as 'low' | 'medium' | 'high' | 'critical'
    }
    return 'medium'
  }

  /**
   * 불린 값 파싱
   */
  private parseBoolean(value: string): boolean {
    return value.toLowerCase() === 'true'
  }

  /**
   * 양의 정수 파싱 및 범위 검증
   */
  private parsePositiveInteger(value: string, defaultValue: number, maxValue?: number): number {
    const parsed = parseInt(value, 10)
    if (isNaN(parsed) || parsed <= 0) {
      return defaultValue
    }
    if (maxValue && parsed > maxValue) {
      return maxValue
    }
    return parsed
  }
}