import { Router, Request, Response } from 'express'
import { SRSScheduleController } from '../controllers/SRSScheduleController'
import { 
  CreateReviewScheduleUseCase,
  GetOverdueReviewsUseCase
} from '@woodie/application/srs/use-cases/index'
import { 
  SupabaseReviewScheduleRepository,
  SpacedRepetitionPolicyService
} from '@woodie/infrastructure/srs/index'
import { SystemClock } from '@woodie/infrastructure'
import { authMiddleware } from '../../middleware/AuthMiddleware'
import { validateRequest } from '../../middleware/ValidationMiddleware'
import { rateLimitMiddleware } from '../../middleware/RateLimitMiddleware'
import { body, param, query } from 'express-validator'
import { supabaseClient } from '../../config/database'

/**
 * SRS 스케줄 관리 라우트
 * 
 * 엔드포인트:
 * - POST /api/srs/schedules - 복습 스케줄 생성
 * - GET /api/srs/schedules/overdue - 연체된 복습 스케줄 조회 (상세)
 */
export function createSRSScheduleRoutes(): Router {
  const router = Router()

  // 의존성 주입 설정
  const clock = new SystemClock()
  const spacedRepetitionPolicy = new SpacedRepetitionPolicyService()
  const reviewScheduleRepository = new SupabaseReviewScheduleRepository(supabaseClient)

  // Use Case 인스턴스 생성
  const createReviewScheduleUseCase = new CreateReviewScheduleUseCase(
    spacedRepetitionPolicy,
    clock
  )

  const getOverdueReviewsUseCase = new GetOverdueReviewsUseCase(
    reviewScheduleRepository,
    clock
  )

  // Controller 인스턴스 생성
  const scheduleController = new SRSScheduleController(
    createReviewScheduleUseCase,
    getOverdueReviewsUseCase
  )

  // 모든 라우트에 인증 미들웨어 적용
  router.use(authMiddleware)

  /**
   * POST /api/srs/schedules
   * 새로운 복습 스케줄 생성
   */
  router.post('/',
    rateLimitMiddleware(60, 50), // 분당 50회 제한
    [
      body('studentId')
        .isUUID()
        .withMessage('Student ID must be a valid UUID'),
      body('problemId')
        .isUUID()
        .withMessage('Problem ID must be a valid UUID')
    ],
    validateRequest,
    (req: Request, res: Response) => scheduleController.createReviewSchedule(req, res)
  )

  /**
   * GET /api/srs/schedules/overdue
   * 연체된 복습 스케줄 상세 조회
   */
  router.get('/overdue',
    rateLimitMiddleware(60, 30), // 분당 30회 제한
    [
      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
      query('offset')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Offset must be non-negative'),
      query('sortBy')
        .optional()
        .isIn(['overdue_duration', 'difficulty', 'priority', 'next_review_date'])
        .withMessage('Invalid sortBy value'),
      query('sortOrder')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('Invalid sortOrder value')
    ],
    validateRequest,
    (req: Request, res: Response) => scheduleController.getDetailedOverdueReviews(req, res)
  )

  return router
}

/**
 * SRS 스케줄 라우트를 메인 앱에 마운트하기 위한 헬퍼 함수
 */
export function mountSRSScheduleRoutes(app: any): void {
  const scheduleRoutes = createSRSScheduleRoutes()
  
  // /api/srs/schedules 경로에 라우트 마운트
  app.use('/api/srs/schedules', scheduleRoutes)
  
  console.log('✅ SRS Schedule routes mounted at /api/srs/schedules')
}