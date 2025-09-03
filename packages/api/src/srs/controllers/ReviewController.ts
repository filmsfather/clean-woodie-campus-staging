import { Request, Response } from 'express'
import { UniqueEntityID } from '@domain/common/Identifier'
import { ReviewFeedback, NotificationType } from '@domain/srs'
import { ReviewQueueService } from '@application/srs/services/ReviewQueueService'
import { NotificationManagementService } from '@application/srs/services/NotificationManagementService'
import { BaseController } from '../../common/BaseController'

// Request/Response 타입 정의
interface TodayReviewsRequest {
  userId: string
}

interface SubmitFeedbackRequest {
  scheduleId: string
  feedback: 'AGAIN' | 'HARD' | 'GOOD' | 'EASY'
  responseTime?: number
  answerContent?: any
}

interface ReviewStatisticsRequest {
  userId: string
}

interface NotificationSettingsRequest {
  enabled?: boolean
  reviewReminders?: boolean
  overdueReminders?: boolean
  dailySummary?: boolean
  milestoneAlerts?: boolean
  quietHours?: {
    start: string
    end: string
  }
  timezone?: string
}

/**
 * SRS 복습 관련 API 컨트롤러
 * 복습 큐 조회, 피드백 제출, 통계 조회 등의 엔드포인트 제공
 */
export class ReviewController extends BaseController {
  constructor(
    private reviewQueueService: ReviewQueueService,
    private notificationService: NotificationManagementService
  ) {
    super()
  }

  /**
   * GET /api/srs/reviews/today
   * 오늘의 복습 항목 조회 (우선순위별 정렬)
   */
  async getTodayReviews(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req) // 인증 미들웨어에서 설정된 사용자 ID
      
      if (!userId) {
        this.unauthorized(res, 'Authentication required')
        return
      }

      const result = await this.reviewQueueService.getTodayReviews(
        new UniqueEntityID(userId)
      )

      if (result.isFailure) {
        this.clientError(res, result.error)
        return
      }

      const reviewItems = result.getValue()

      this.ok(res, {
        reviews: reviewItems,
        totalCount: reviewItems.length,
        highPriorityCount: reviewItems.filter(item => item.priority === 'high').length,
        overdueCount: reviewItems.filter(item => item.isOverdue).length
      })

    } catch (error) {
      console.error('Error getting today reviews:', error)
      this.fail(res, 'Failed to get today reviews')
    }
  }

  /**
   * GET /api/srs/reviews/overdue
   * 연체된 복습 항목 조회
   */
  async getOverdueReviews(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req)
      
      if (!userId) {
        this.unauthorized(res, 'Authentication required')
        return
      }

      const result = await this.reviewQueueService.getOverdueReviews(
        new UniqueEntityID(userId)
      )

      if (result.isFailure) {
        this.clientError(res, result.error)
        return
      }

      const overdueItems = result.getValue()

      this.ok(res, {
        overdueReviews: overdueItems,
        totalCount: overdueItems.length,
        averageOverdueDays: this.calculateAverageOverdueDays(overdueItems)
      })

    } catch (error) {
      console.error('Error getting overdue reviews:', error)
      this.fail(res, 'Failed to get overdue reviews')
    }
  }

  /**
   * POST /api/srs/reviews/:scheduleId/feedback
   * 복습 피드백 제출
   */
  async submitReviewFeedback(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req)
      const { scheduleId } = req.params
      const { feedback, responseTime, answerContent }: SubmitFeedbackRequest = req.body

      if (!userId) {
        this.unauthorized(res, 'Authentication required')
        return
      }

      if (!scheduleId || !feedback) {
        this.clientError(res, 'Schedule ID and feedback are required')
        return
      }

      // 피드백 값 객체 생성
      const feedbackResult = ReviewFeedback.create(feedback)
      if (feedbackResult.isFailure) {
        this.clientError(res, `Invalid feedback: ${feedbackResult.error}`)
        return
      }

      // 복습 완료 처리
      const completionResult = await this.reviewQueueService.markReviewCompleted(
        new UniqueEntityID(userId),
        new UniqueEntityID(scheduleId),
        feedbackResult.getValue(),
        responseTime,
        answerContent
      )

      if (completionResult.isFailure) {
        this.clientError(res, completionResult.error)
        return
      }

      const completionData = completionResult.getValue()

      this.ok(res, {
        message: 'Review feedback submitted successfully',
        result: {
          scheduleId: completionData.scheduleId,
          previousInterval: completionData.previousInterval,
          newInterval: completionData.newInterval,
          previousEaseFactor: completionData.previousEaseFactor,
          newEaseFactor: completionData.newEaseFactor,
          nextReviewAt: completionData.nextReviewAt,
          reviewCount: completionData.reviewCount
        }
      })

    } catch (error) {
      console.error('Error submitting review feedback:', error)
      this.fail(res, 'Failed to submit review feedback')
    }
  }

  /**
   * GET /api/srs/reviews/statistics
   * 복습 통계 조회
   */
  async getReviewStatistics(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req)
      
      if (!userId) {
        this.unauthorized(res, 'Authentication required')
        return
      }

      const result = await this.reviewQueueService.getReviewStatistics(
        new UniqueEntityID(userId)
      )

      if (result.isFailure) {
        this.clientError(res, result.error)
        return
      }

      const statistics = result.getValue()

      this.ok(res, {
        statistics: {
          totalScheduled: statistics.totalScheduled,
          dueToday: statistics.dueToday,
          overdue: statistics.overdue,
          completedToday: statistics.completedToday,
          streakDays: statistics.streakDays,
          averageRetention: statistics.averageRetention,
          totalTimeSpent: statistics.totalTimeSpent,
          // 추가 계산된 지표들
          completionRate: statistics.totalScheduled > 0 ? 
            Math.round((statistics.completedToday / statistics.dueToday) * 100) : 0,
          efficiency: statistics.totalTimeSpent > 0 ? 
            Math.round(statistics.completedToday / (statistics.totalTimeSpent / 60)) : 0
        }
      })

    } catch (error) {
      console.error('Error getting review statistics:', error)
      this.fail(res, 'Failed to get review statistics')
    }
  }

  /**
   * GET /api/srs/notifications/settings
   * 알림 설정 조회
   */
  async getNotificationSettings(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req)
      
      if (!userId) {
        this.unauthorized(res, 'Authentication required')
        return
      }

      // NotificationManagementService를 통해 설정 조회
      const result = await this.notificationService.initializeUserNotifications(
        new UniqueEntityID(userId)
      )

      if (result.isFailure) {
        this.clientError(res, result.error)
        return
      }

      this.ok(res, {
        subscription: result.getValue()
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
      const userId = this.getUserId(req)
      const updates: NotificationSettingsRequest = req.body

      if (!userId) {
        this.unauthorized(res, 'Authentication required')
        return
      }

      const result = await this.notificationService.updateNotificationSettings(
        new UniqueEntityID(userId),
        updates
      )

      if (result.isFailure) {
        this.clientError(res, result.error)
        return
      }

      const updatedSettings = result.getValue()

      this.ok(res, {
        message: 'Notification settings updated successfully',
        settings: {
          enabled: updatedSettings.enabled,
          reviewReminders: updatedSettings.reviewReminders,
          overdueReminders: updatedSettings.overdueReminders,
          dailySummary: updatedSettings.dailySummary,
          milestoneAlerts: updatedSettings.milestoneAlerts,
          quietHours: updatedSettings.quietHours,
          timezone: updatedSettings.timezone
        }
      })

    } catch (error) {
      console.error('Error updating notification settings:', error)
      this.fail(res, 'Failed to update notification settings')
    }
  }

  /**
   * GET /api/srs/notifications/statistics
   * 알림 통계 조회
   */
  async getNotificationStatistics(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req)
      
      if (!userId) {
        this.unauthorized(res, 'Authentication required')
        return
      }

      const result = await this.notificationService.getNotificationStatistics(
        new UniqueEntityID(userId)
      )

      if (result.isFailure) {
        this.clientError(res, result.error)
        return
      }

      this.ok(res, result.getValue())

    } catch (error) {
      console.error('Error getting notification statistics:', error)
      this.fail(res, 'Failed to get notification statistics')
    }
  }

  /**
   * POST /api/srs/notifications/test
   * 테스트 알림 전송 (개발용)
   */
  async sendTestNotification(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req)
      
      if (!userId) {
        this.unauthorized(res, 'Authentication required')
        return
      }

      const result = await this.notificationService.sendImmediateNotification(
        new UniqueEntityID(userId),
        NotificationType.reviewDue(),
        '테스트 알림',
        '알림 시스템이 정상적으로 작동하고 있습니다.',
        { test: true, timestamp: new Date().toISOString() }
      )

      if (result.isFailure) {
        this.clientError(res, result.error)
        return
      }

      this.ok(res, {
        message: 'Test notification sent successfully'
      })

    } catch (error) {
      console.error('Error sending test notification:', error)
      this.fail(res, 'Failed to send test notification')
    }
  }

  /**
   * 평균 연체 일수 계산 헬퍼 메서드
   */
  private calculateAverageOverdueDays(overdueItems: any[]): number {
    if (overdueItems.length === 0) return 0

    const totalOverdueDays = overdueItems.reduce((sum, item) => {
      const overdueDays = Math.floor(
        (Date.now() - item.nextReviewAt.getTime()) / (1000 * 60 * 60 * 24)
      )
      return sum + Math.max(0, overdueDays)
    }, 0)

    return Math.round(totalOverdueDays / overdueItems.length * 10) / 10 // 소수점 1자리
  }

  /**
   * 요청에서 사용자 ID 추출 (인증 미들웨어에서 설정)
   */
  private getUserId(req: Request): string | undefined {
    return (req as any).user?.id || req.headers['x-user-id'] as string
  }
}