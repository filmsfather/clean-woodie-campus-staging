import { Router, Request, Response } from 'express'
import { ReviewController } from '../controllers/ReviewController'
import { 
  GetTodayReviewsUseCase,
  SubmitReviewFeedbackUseCase
} from '@woodie/application/srs/use-cases/index'
import { ReviewQueueService } from '@woodie/application/srs/services/ReviewQueueService'
import { 
  SupabaseReviewScheduleRepository,
  SupabaseStudyRecordRepository,
  SpacedRepetitionPolicyService
} from '@woodie/infrastructure/srs'
import { SystemClock } from '@woodie/infrastructure'
import { authMiddleware } from '../../middleware/AuthMiddleware'
import { validateRequest } from '../../middleware/ValidationMiddleware'
import { rateLimitMiddleware } from '../../middleware/RateLimitMiddleware'
import { body, param } from 'express-validator'
import { supabaseClient } from '../../config/database'

/**
 * SRS 복습 큐 및 피드백 API 라우트 설정 (리팩토링됨)
 * 
 * 엔드포인트:
 * - GET /api/srs/reviews/today - 오늘의 복습 항목 조회
 * - POST /api/srs/reviews/:scheduleId/feedback - 복습 피드백 제출
 * 
 * 다른 기능들은 전용 라우트로 분리:
 * - 스케줄 관리: SRSScheduleRoutes
 * - 분석/통계: SRSAnalyticsRoutes  
 * - 알림 관리: SRSNotificationRoutes
 * - 학습 기록: SRSStudyRecordRoutes
 */
export function createReviewRoutes(): Router {
  const router = Router()

  // 의존성 주입 설정
  const clock = new SystemClock()
  const spacedRepetitionPolicy = new SpacedRepetitionPolicyService()
  
  // Repository 인스턴스 생성
  const reviewScheduleRepository = new SupabaseReviewScheduleRepository(supabaseClient)
  const studyRecordRepository = new SupabaseStudyRecordRepository(supabaseClient)

  // Service 인스턴스 생성
  const reviewQueueService = new ReviewQueueService(
    reviewScheduleRepository,
    studyRecordRepository,
    spacedRepetitionPolicy,
    clock
  )

  // Use Case 인스턴스 생성
  const getTodayReviewsUseCase = new GetTodayReviewsUseCase(
    reviewQueueService
  )

  const submitReviewFeedbackUseCase = new SubmitReviewFeedbackUseCase(
    reviewQueueService
  )

  // Controller 인스턴스 생성
  const reviewController = new ReviewController(
    getTodayReviewsUseCase,
    submitReviewFeedbackUseCase
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