import request from 'supertest'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import express from 'express'
import { createReviewRoutes } from '../../packages/api/src/srs/routes/ReviewRoutes'

// Mock dependencies
vi.mock('@infrastructure', () => ({
  SupabaseReviewScheduleRepository: vi.fn(),
  SupabaseStudyRecordRepository: vi.fn(),
  SupabaseNotificationService: vi.fn(),
  SupabaseNotificationSettingsRepository: vi.fn(),
  SupabaseNotificationHistoryRepository: vi.fn(),
  SystemClock: vi.fn(() => ({
    now: () => new Date('2024-01-15T10:00:00Z')
  }))
}))

vi.mock('@domain/srs', () => ({
  SpacedRepetitionCalculator: vi.fn(),
  ReviewFeedback: {
    create: vi.fn()
  },
  NotificationType: {
    reviewDue: vi.fn(() => ({
      value: 'review_due',
      isUrgent: () => false,
      getCategory: () => 'review'
    }))
  }
}))

vi.mock('@application/srs/services/ReviewQueueService')
vi.mock('@application/srs/services/NotificationManagementService')

// Mock auth middleware to always authenticate
vi.mock('../../packages/api/src/middleware/AuthMiddleware', () => ({
  authMiddleware: (req: any, res: any, next: any) => {
    req.user = { id: 'test-user-id', email: 'test@example.com', role: 'user' }
    next()
  }
}))

describe('SRS System Integration Tests', () => {
  let app: express.Application
  let mockReviewQueueService: any
  let mockNotificationService: any

  beforeEach(async () => {
    // Mock 서비스 설정
    const { ReviewQueueService } = await import('@application/srs/services/ReviewQueueService')
    const { NotificationManagementService } = await import('@application/srs/services/NotificationManagementService')
    
    mockReviewQueueService = {
      getTodayReviews: vi.fn(),
      getOverdueReviews: vi.fn(),
      markReviewCompleted: vi.fn(),
      getReviewStatistics: vi.fn()
    }
    
    mockNotificationService = {
      initializeUserNotifications: vi.fn(),
      updateNotificationSettings: vi.fn(),
      getNotificationStatistics: vi.fn(),
      sendImmediateNotification: vi.fn()
    }

    vi.mocked(ReviewQueueService).mockImplementation(() => mockReviewQueueService)
    vi.mocked(NotificationManagementService).mockImplementation(() => mockNotificationService)

    // Express 앱 설정
    app = express()
    app.use(express.json())
    app.use('/api/srs', createReviewRoutes())
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('복습 항목 조회', () => {
    it('오늘의 복습 항목을 성공적으로 조회해야 함', async () => {
      // Arrange
      const mockReviews = [
        {
          scheduleId: 'schedule-1',
          studentId: 'test-user-id',
          problemId: 'problem-1',
          nextReviewAt: new Date('2024-01-15T10:00:00Z'),
          currentInterval: 7,
          easeFactor: 2.5,
          reviewCount: 3,
          consecutiveFailures: 0,
          priority: 'high' as const,
          isOverdue: false,
          minutesUntilDue: 0,
          difficultyLevel: 'intermediate' as const,
          retentionProbability: 0.8
        }
      ]

      mockReviewQueueService.getTodayReviews.mockResolvedValue({
        isSuccess: true,
        getValue: () => mockReviews
      })

      // Act
      const response = await request(app)
        .get('/api/srs/reviews/today')

      // Assert
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.reviews).toEqual(mockReviews)
      expect(response.body.data.totalCount).toBe(1)
      expect(response.body.data.highPriorityCount).toBe(1)
      expect(response.body.data.overdueCount).toBe(0)
    })

    it('연체된 복습 항목을 올바르게 조회해야 함', async () => {
      // Arrange
      const mockOverdueReviews = [
        {
          scheduleId: 'schedule-2',
          studentId: 'test-user-id',
          problemId: 'problem-2',
          nextReviewAt: new Date('2024-01-14T10:00:00Z'), // 하루 연체
          currentInterval: 3,
          easeFactor: 2.3,
          reviewCount: 2,
          consecutiveFailures: 1,
          priority: 'high' as const,
          isOverdue: true,
          minutesUntilDue: -1440, // -24시간
          difficultyLevel: 'advanced' as const,
          retentionProbability: 0.6
        }
      ]

      mockReviewQueueService.getOverdueReviews.mockResolvedValue({
        isSuccess: true,
        getValue: () => mockOverdueReviews
      })

      // Act
      const response = await request(app)
        .get('/api/srs/reviews/overdue')

      // Assert
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.overdueReviews).toEqual(mockOverdueReviews)
      expect(response.body.data.totalCount).toBe(1)
    })
  })

  describe('복습 피드백 처리', () => {
    const mockScheduleId = '123e4567-e89b-12d3-a456-426614174000'

    it('GOOD 피드백으로 성공적으로 처리되어야 함', async () => {
      // Arrange
      const { ReviewFeedback } = await import('@domain/srs')
      const mockFeedback = { value: 'GOOD', isAgain: () => false }
      
      vi.mocked(ReviewFeedback.create).mockReturnValue({
        isSuccess: true,
        isFailure: false,
        getValue: () => mockFeedback,
        error: ''
      })

      mockReviewQueueService.markReviewCompleted.mockResolvedValue({
        isSuccess: true,
        getValue: () => ({
          scheduleId: mockScheduleId,
          previousInterval: 7,
          newInterval: 18,
          previousEaseFactor: 2.5,
          newEaseFactor: 2.6,
          nextReviewAt: new Date('2024-02-02T10:00:00Z'),
          reviewCount: 4
        })
      })

      // Act
      const response = await request(app)
        .post(`/api/srs/reviews/${mockScheduleId}/feedback`)
        .send({
          feedback: 'GOOD',
          responseTime: 45,
          answerContent: { selectedOption: 'A', confidence: 4 }
        })

      // Assert
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.result.scheduleId).toBe(mockScheduleId)
      expect(response.body.data.result.newInterval).toBe(18)
      expect(mockReviewQueueService.markReviewCompleted).toHaveBeenCalledWith(
        expect.any(Object), // UniqueEntityID
        expect.any(Object), // UniqueEntityID  
        mockFeedback,
        45,
        { selectedOption: 'A', confidence: 4 }
      )
    })

    it('AGAIN 피드백으로 간격이 줄어들어야 함', async () => {
      // Arrange
      const { ReviewFeedback } = await import('@domain/srs')
      const mockFeedback = { value: 'AGAIN', isAgain: () => true }
      
      vi.mocked(ReviewFeedback.create).mockReturnValue({
        isSuccess: true,
        isFailure: false,
        getValue: () => mockFeedback,
        error: ''
      })

      mockReviewQueueService.markReviewCompleted.mockResolvedValue({
        isSuccess: true,
        getValue: () => ({
          scheduleId: mockScheduleId,
          previousInterval: 7,
          newInterval: 1, // 간격이 크게 줄어듦
          previousEaseFactor: 2.5,
          newEaseFactor: 2.2, // ease factor도 감소
          nextReviewAt: new Date('2024-01-16T10:00:00Z'),
          reviewCount: 4
        })
      })

      // Act
      const response = await request(app)
        .post(`/api/srs/reviews/${mockScheduleId}/feedback`)
        .send({
          feedback: 'AGAIN',
          responseTime: 120
        })

      // Assert
      expect(response.status).toBe(200)
      expect(response.body.data.result.newInterval).toBe(1)
      expect(response.body.data.result.newEaseFactor).toBeLessThan(2.5)
    })

    it('잘못된 피드백 값으로 422 에러를 반환해야 함', async () => {
      // Act
      const response = await request(app)
        .post(`/api/srs/reviews/${mockScheduleId}/feedback`)
        .send({
          feedback: 'INVALID_FEEDBACK'
        })

      // Assert
      expect(response.status).toBe(422)
      expect(response.body.success).toBe(false)
      expect(response.body.error.type).toBe('ValidationError')
    })

    it('잘못된 UUID 형식으로 422 에러를 반환해야 함', async () => {
      // Act
      const response = await request(app)
        .post('/api/srs/reviews/invalid-uuid/feedback')
        .send({
          feedback: 'GOOD'
        })

      // Assert
      expect(response.status).toBe(422)
      expect(response.body.success).toBe(false)
    })
  })

  describe('복습 통계', () => {
    it('성공적으로 복습 통계를 조회해야 함', async () => {
      // Arrange
      const mockStats = {
        totalScheduled: 50,
        dueToday: 5,
        overdue: 2,
        completedToday: 3,
        streakDays: 7,
        averageRetention: 85,
        totalTimeSpent: 45 // 분
      }

      mockReviewQueueService.getReviewStatistics.mockResolvedValue({
        isSuccess: true,
        getValue: () => mockStats
      })

      // Act
      const response = await request(app)
        .get('/api/srs/reviews/statistics')

      // Assert
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.statistics.totalScheduled).toBe(50)
      expect(response.body.data.statistics.completionRate).toBe(60) // 3/5 * 100
      expect(response.body.data.statistics.efficiency).toBeDefined()
    })

    it('빈 통계도 올바르게 처리해야 함', async () => {
      // Arrange
      const emptyStats = {
        totalScheduled: 0,
        dueToday: 0,
        overdue: 0,
        completedToday: 0,
        streakDays: 0,
        averageRetention: 0,
        totalTimeSpent: 0
      }

      mockReviewQueueService.getReviewStatistics.mockResolvedValue({
        isSuccess: true,
        getValue: () => emptyStats
      })

      // Act
      const response = await request(app)
        .get('/api/srs/reviews/statistics')

      // Assert
      expect(response.status).toBe(200)
      expect(response.body.data.statistics.completionRate).toBe(0)
      expect(response.body.data.statistics.efficiency).toBe(0)
    })
  })

  describe('알림 설정', () => {
    it('성공적으로 알림 설정을 업데이트해야 함', async () => {
      // Arrange
      const mockUpdatedSettings = {
        enabled: true,
        reviewReminders: true,
        overdueReminders: false,
        dailySummary: true,
        milestoneAlerts: true,
        quietHours: { start: '22:00', end: '08:00' },
        timezone: 'Asia/Seoul'
      }

      mockNotificationService.updateNotificationSettings.mockResolvedValue({
        isSuccess: true,
        getValue: () => mockUpdatedSettings
      })

      // Act
      const response = await request(app)
        .put('/api/srs/notifications/settings')
        .send({
          enabled: true,
          overdueReminders: false,
          quietHours: { start: '22:00', end: '08:00' }
        })

      // Assert
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.settings.overdueReminders).toBe(false)
    })

    it('잘못된 시간 형식으로 422 에러를 반환해야 함', async () => {
      // Act
      const response = await request(app)
        .put('/api/srs/notifications/settings')
        .send({
          quietHours: { start: '25:00', end: '08:00' } // 잘못된 시간
        })

      // Assert
      expect(response.status).toBe(422)
      expect(response.body.success).toBe(false)
      expect(response.body.error.type).toBe('ValidationError')
    })

    it('알림 통계를 올바르게 조회해야 함', async () => {
      // Arrange
      const mockNotificationStats = {
        totalSent: 25,
        successRate: 96,
        averageDeliveryTime: 1200, // ms
        notificationsByType: {
          'review_due': 15,
          'review_overdue': 8,
          'daily_summary': 2
        },
        activeSubscriptions: 1,
        recentFailures: 1
      }

      mockNotificationService.getNotificationStatistics.mockResolvedValue({
        isSuccess: true,
        getValue: () => mockNotificationStats
      })

      // Act
      const response = await request(app)
        .get('/api/srs/notifications/statistics')

      // Assert
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.totalSent).toBe(25)
      expect(response.body.data.successRate).toBe(96)
    })
  })

  describe('에러 처리', () => {
    it('서비스 레이어 에러를 올바르게 처리해야 함', async () => {
      // Arrange
      mockReviewQueueService.getTodayReviews.mockResolvedValue({
        isFailure: true,
        error: 'Database connection failed'
      })

      // Act
      const response = await request(app)
        .get('/api/srs/reviews/today')

      // Assert
      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toContain('Database connection failed')
    })

    it('예상치 못한 에러를 500으로 처리해야 함', async () => {
      // Arrange
      mockReviewQueueService.getTodayReviews.mockRejectedValue(new Error('Unexpected error'))

      // Act
      const response = await request(app)
        .get('/api/srs/reviews/today')

      // Assert
      expect(response.status).toBe(500)
      expect(response.body.success).toBe(false)
      expect(response.body.error.type).toBe('InternalServerError')
    })
  })
})