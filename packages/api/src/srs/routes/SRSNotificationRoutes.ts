import { Router, Request, Response } from 'express'
import { SRSNotificationController } from '../controllers/SRSNotificationController'
import { 
  GetNotificationStatusUseCase,
  ManageNotificationSettingsUseCase,
  ProcessNotificationQueueUseCase,
  TriggerOverdueNotificationUseCase
} from '@woodie/application/srs/use-cases/index'
import { 
  SupabaseNotificationRepository,
  SupabaseNotificationSettingsRepository,
  SupabaseNotificationHistoryRepository,
  NotificationStatisticsService
} from '@woodie/infrastructure/srs/index'
import { SystemClock } from '@woodie/infrastructure'
import { authMiddleware } from '../../middleware/AuthMiddleware'
import { validateRequest } from '../../middleware/ValidationMiddleware'
import { rateLimitMiddleware } from '../../middleware/RateLimitMiddleware'
import { body, query } from 'express-validator'
import { supabaseClient } from '../../config/database'

/**
 * SRS 알림 관리 라우트
 * 
 * 엔드포인트:
 * - GET /api/srs/notifications/status - 알림 상태 조회
 * - GET /api/srs/notifications/settings - 알림 설정 조회
 * - PUT /api/srs/notifications/settings - 알림 설정 업데이트
 * - POST /api/srs/notifications/process-queue - 알림 큐 처리 (관리자용)
 * - POST /api/srs/notifications/trigger-overdue - 연체 알림 트리거
 * - POST /api/srs/notifications/test - 테스트 알림 전송 (개발용)
 */
export function createSRSNotificationRoutes(): Router {
  const router = Router()

  // 의존성 주입 설정
  const clock = new SystemClock()
  const notificationRepository = new SupabaseNotificationRepository(supabaseClient)
  const notificationSettingsRepository = new SupabaseNotificationSettingsRepository(supabaseClient)
  const notificationHistoryRepository = new SupabaseNotificationHistoryRepository(supabaseClient)
  const notificationStatisticsService = new NotificationStatisticsService(
    notificationRepository
  )

  // Use Case 인스턴스 생성
  const getNotificationStatusUseCase = new GetNotificationStatusUseCase(
    notificationRepository,
    notificationStatisticsService
  )

  const manageNotificationSettingsUseCase = new ManageNotificationSettingsUseCase(
    notificationSettingsRepository
  )

  const processNotificationQueueUseCase = new ProcessNotificationQueueUseCase(
    notificationRepository,
    /* notificationSender */ null as any, // TODO: 실제 구현 필요
    /* notificationSettingsRepository */ null as any, // TODO: 실제 구현 필요
    clock
  )

  const triggerOverdueNotificationUseCase = new TriggerOverdueNotificationUseCase(
    /* reviewScheduleRepository */ null as any, // TODO: 실제 구현 필요
    clock
  )

  // Controller 인스턴스 생성
  const notificationController = new SRSNotificationController(
    getNotificationStatusUseCase,
    manageNotificationSettingsUseCase,
    processNotificationQueueUseCase,
    triggerOverdueNotificationUseCase
  )

  // 모든 라우트에 인증 미들웨어 적용
  router.use(authMiddleware)

  /**
   * GET /api/srs/notifications/status
   * 알림 발송 상태 조회
   */
  router.get('/notifications/status',
    rateLimitMiddleware(60, 30), // 분당 30회 제한
    [
      query('includeScheduled')
        .optional()
        .isBoolean()
        .withMessage('includeScheduled must be boolean'),
      query('includeSent')
        .optional()
        .isBoolean()
        .withMessage('includeSent must be boolean'),
      query('includeStatistics')
        .optional()
        .isBoolean()
        .withMessage('includeStatistics must be boolean'),
      query('timeRangeInDays')
        .optional()
        .isInt({ min: 1, max: 90 })
        .withMessage('timeRangeInDays must be between 1 and 90')
    ],
    validateRequest,
    (req: Request, res: Response) => notificationController.getNotificationStatus(req, res)
  )

  /**
   * GET /api/srs/notifications/settings
   * 알림 설정 조회
   */
  router.get('/notifications/settings',
    rateLimitMiddleware(60, 20), // 분당 20회 제한
    (req: Request, res: Response) => notificationController.getNotificationSettings(req, res)
  )

  /**
   * PUT /api/srs/notifications/settings
   * 알림 설정 업데이트
   */
  router.put('/notifications/settings',
    rateLimitMiddleware(60, 10), // 분당 10회 제한
    [
      body('enableReviewReminders')
        .optional()
        .isBoolean()
        .withMessage('enableReviewReminders must be boolean'),
      body('enableOverdueAlerts')
        .optional()
        .isBoolean()
        .withMessage('enableOverdueAlerts must be boolean'),
      body('enableStreakNotifications')
        .optional()
        .isBoolean()
        .withMessage('enableStreakNotifications must be boolean'),
      body('enableAchievementNotifications')
        .optional()
        .isBoolean()
        .withMessage('enableAchievementNotifications must be boolean'),
      body('reminderMinutesBefore')
        .optional()
        .isInt({ min: 5, max: 1440 })
        .withMessage('reminderMinutesBefore must be between 5 and 1440'),
      body('overdueThresholdHours')
        .optional()
        .isInt({ min: 1, max: 168 })
        .withMessage('overdueThresholdHours must be between 1 and 168'),
      body('quietHoursStart')
        .optional()
        .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('quietHoursStart must be in HH:MM format'),
      body('quietHoursEnd')
        .optional()
        .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('quietHoursEnd must be in HH:MM format'),
      body('preferredDeliveryMethods')
        .optional()
        .isArray({ min: 1 })
        .withMessage('preferredDeliveryMethods must be a non-empty array'),
      body('preferredDeliveryMethods.*')
        .optional()
        .isIn(['push', 'email', 'in_app'])
        .withMessage('Invalid delivery method')
    ],
    validateRequest,
    (req: Request, res: Response) => notificationController.updateNotificationSettings(req, res)
  )

  /**
   * POST /api/srs/notifications/process-queue
   * 알림 큐 처리 (관리자용)
   */
  router.post('/notifications/process-queue',
    rateLimitMiddleware(60, 5), // 분당 5회 제한 (관리자용)
    [
      body('batchSize')
        .optional()
        .isInt({ min: 1, max: 200 })
        .withMessage('batchSize must be between 1 and 200'),
      body('priority')
        .optional()
        .isIn(['low', 'normal', 'high', 'urgent'])
        .withMessage('Invalid priority value')
    ],
    validateRequest,
    (req: Request, res: Response) => notificationController.processNotificationQueue(req, res)
  )

  /**
   * POST /api/srs/notifications/trigger-overdue
   * 연체 알림 트리거
   */
  router.post('/notifications/trigger-overdue',
    rateLimitMiddleware(60, 10), // 분당 10회 제한
    [
      body('studentId')
        .optional()
        .isUUID()
        .withMessage('Student ID must be a valid UUID'),
      body('force')
        .optional()
        .isBoolean()
        .withMessage('force must be boolean')
    ],
    validateRequest,
    (req: Request, res: Response) => notificationController.triggerOverdueNotification(req, res)
  )

  /**
   * POST /api/srs/notifications/test
   * 테스트 알림 전송 (개발용)
   */
  if (process.env.NODE_ENV !== 'production') {
    router.post('/notifications/test',
      rateLimitMiddleware(60, 5), // 분당 5회 제한
      [
        body('type')
          .optional()
          .isIn(['review', 'overdue', 'streak', 'achievement'])
          .withMessage('Invalid notification type'),
        body('title')
          .optional()
          .isLength({ min: 1, max: 100 })
          .withMessage('Title must be between 1 and 100 characters'),
        body('message')
          .optional()
          .isLength({ min: 1, max: 500 })
          .withMessage('Message must be between 1 and 500 characters')
      ],
      validateRequest,
      (req: Request, res: Response) => notificationController.sendTestNotification(req, res)
    )
  }

  return router
}

/**
 * SRS 알림 라우트를 메인 앱에 마운트하기 위한 헬퍼 함수
 */
export function mountSRSNotificationRoutes(app: any): void {
  const notificationRoutes = createSRSNotificationRoutes()
  
  // /api/srs 경로에 라우트 마운트
  app.use('/api/srs', notificationRoutes)
  
  console.log('✅ SRS Notification routes mounted at /api/srs')
}