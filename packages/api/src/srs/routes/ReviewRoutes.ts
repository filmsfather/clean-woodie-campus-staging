import { Router, Request, Response } from 'express'
import { ReviewController } from '../controllers/ReviewController'
import { ReviewQueueService } from '@woodie/application/srs/services/ReviewQueueService'
import { NotificationManagementService } from '@woodie/application/srs/services/NotificationManagementService'
import { 
  SupabaseReviewScheduleRepository,
  SupabaseStudyRecordRepository,
  SystemClock,
  SupabaseNotificationService,
  SupabaseNotificationSettingsRepository,
  SupabaseNotificationHistoryRepository
} from '@woodie/infrastructure'
import { SpacedRepetitionCalculator } from '@woodie/domain/srs'
import { authMiddleware } from '../../middleware/AuthMiddleware'
import { validateRequest } from '../../middleware/ValidationMiddleware'
import { rateLimitMiddleware } from '../../middleware/RateLimitMiddleware'
import { body, param } from 'express-validator'
import { supabaseClient } from '../../config/database'

/**
 * SRS 복습 관련 API 라우트 설정
 * 
 * 엔드포인트:
 * - GET /api/srs/reviews/today - 오늘의 복습 항목 조회
 * - GET /api/srs/reviews/overdue - 연체된 복습 항목 조회
 * - POST /api/srs/reviews/:scheduleId/feedback - 복습 피드백 제출
 * - GET /api/srs/reviews/statistics - 복습 통계 조회
 * - GET /api/srs/notifications/settings - 알림 설정 조회
 * - PUT /api/srs/notifications/settings - 알림 설정 업데이트
 * - GET /api/srs/notifications/statistics - 알림 통계 조회
 * - POST /api/srs/notifications/test - 테스트 알림 전송 (개발용)
 */
export function createReviewRoutes(): Router {
  const router = Router()

  // 의존성 주입 설정
  const clock = new SystemClock()
  const spacedRepetitionPolicy = new SpacedRepetitionCalculator()
  
  // Repository 인스턴스 생성 (실제 Supabase client 주입)
  const reviewScheduleRepository = new SupabaseReviewScheduleRepository(supabaseClient)
  const studyRecordRepository = new SupabaseStudyRecordRepository(supabaseClient)
  const notificationService = new SupabaseNotificationService(supabaseClient)
  const notificationSettingsRepository = new SupabaseNotificationSettingsRepository(supabaseClient)
  const notificationHistoryRepository = new SupabaseNotificationHistoryRepository(supabaseClient)

  // Service 인스턴스 생성
  const reviewQueueService = new ReviewQueueService(
    reviewScheduleRepository,
    studyRecordRepository,
    spacedRepetitionPolicy,
    clock
  )

  const notificationManagementService = new NotificationManagementService(
    notificationService,
    notificationSettingsRepository,
    notificationHistoryRepository,
    clock
  )

  // Controller 인스턴스 생성
  const reviewController = new ReviewController(
    reviewQueueService,
    notificationManagementService
  )

  // 모든 라우트에 인증 미들웨어 적용
  router.use(authMiddleware)

  // 복습 관련 라우트
  
  /**
   * GET /api/srs/reviews/today
   * 오늘의 복습 항목 조회
   */
  router.get('/reviews/today', 
    rateLimitMiddleware(60, 100), // 분당 100회 제한
    (req: Request, res: Response) => reviewController.getTodayReviews(req, res)
  )

  /**
   * GET /api/srs/reviews/overdue  
   * 연체된 복습 항목 조회
   */
  router.get('/reviews/overdue',
    rateLimitMiddleware(60, 50), // 분당 50회 제한  
    (req: Request, res: Response) => reviewController.getOverdueReviews(req, res)
  )

  /**
   * POST /api/srs/reviews/:scheduleId/feedback
   * 복습 피드백 제출
   */
  router.post('/reviews/:scheduleId/feedback',
    rateLimitMiddleware(60, 200), // 분당 200회 제한 (학습 활동이므로 높게)
    [
      param('scheduleId')
        .isUUID()
        .withMessage('Schedule ID must be a valid UUID'),
      body('feedback')
        .isIn(['AGAIN', 'HARD', 'GOOD', 'EASY'])
        .withMessage('Feedback must be one of: AGAIN, HARD, GOOD, EASY'),
      body('responseTime')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Response time must be a non-negative integer'),
      body('answerContent')
        .optional()
        .custom((value) => {
          // 답안 내용은 다양한 형태 허용 (문자열, 객체, 배열 등)
          return true
        })
    ],
    validateRequest,
    (req: Request, res: Response) => reviewController.submitReviewFeedback(req, res)
  )

  /**
   * GET /api/srs/reviews/statistics
   * 복습 통계 조회
   */
  router.get('/reviews/statistics',
    rateLimitMiddleware(60, 30), // 분당 30회 제한
    (req: Request, res: Response) => reviewController.getReviewStatistics(req, res)
  )

  // 알림 관련 라우트

  /**
   * GET /api/srs/notifications/settings
   * 알림 설정 조회
   */
  router.get('/notifications/settings',
    rateLimitMiddleware(60, 20), // 분당 20회 제한
    (req: Request, res: Response) => reviewController.getNotificationSettings(req, res)
  )

  /**
   * PUT /api/srs/notifications/settings
   * 알림 설정 업데이트
   */
  router.put('/notifications/settings',
    rateLimitMiddleware(60, 10), // 분당 10회 제한
    [
      body('enabled')
        .optional()
        .isBoolean()
        .withMessage('Enabled must be a boolean'),
      body('reviewReminders')
        .optional()
        .isBoolean()
        .withMessage('Review reminders must be a boolean'),
      body('overdueReminders')
        .optional()
        .isBoolean()
        .withMessage('Overdue reminders must be a boolean'),
      body('dailySummary')
        .optional()
        .isBoolean()
        .withMessage('Daily summary must be a boolean'),
      body('milestoneAlerts')
        .optional()
        .isBoolean()
        .withMessage('Milestone alerts must be a boolean'),
      body('quietHours.start')
        .optional()
        .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Quiet hours start must be in HH:MM format'),
      body('quietHours.end')
        .optional()
        .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Quiet hours end must be in HH:MM format'),
      body('timezone')
        .optional()
        .isLength({ min: 1, max: 50 })
        .withMessage('Timezone must be a valid string')
    ],
    validateRequest,
    (req: Request, res: Response) => reviewController.updateNotificationSettings(req, res)
  )

  /**
   * GET /api/srs/notifications/statistics
   * 알림 통계 조회
   */
  router.get('/notifications/statistics',
    rateLimitMiddleware(60, 10), // 분당 10회 제한
    (req: Request, res: Response) => reviewController.getNotificationStatistics(req, res)
  )

  /**
   * POST /api/srs/notifications/test
   * 테스트 알림 전송 (개발/디버깅용)
   */
  if (process.env.NODE_ENV !== 'production') {
    router.post('/notifications/test',
      rateLimitMiddleware(60, 5), // 분당 5회 제한
      (req: Request, res: Response) => reviewController.sendTestNotification(req, res)
    )
  }

  return router
}

/**
 * SRS 라우트를 메인 앱에 마운트하기 위한 헬퍼 함수
 */
export function mountSRSRoutes(app: any): void {
  const srsRoutes = createReviewRoutes()
  
  // /api/srs 경로에 라우트 마운트
  app.use('/api/srs', srsRoutes)
  
  console.log('✅ SRS routes mounted at /api/srs')
}