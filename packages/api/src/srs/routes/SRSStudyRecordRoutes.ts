import { Router, Request, Response } from 'express'
import { SRSStudyRecordController } from '../controllers/SRSStudyRecordController'
import { 
  CreateStudyRecordUseCase,
  GetStudyRecordsUseCase
} from '@woodie/application/srs/use-cases/index'
import { SupabaseStudyRecordRepository } from '@woodie/infrastructure/srs/index'
import { authMiddleware } from '../../middleware/AuthMiddleware'
import { validateRequest } from '../../middleware/ValidationMiddleware'
import { rateLimitMiddleware } from '../../middleware/RateLimitMiddleware'
import { body, param, query } from 'express-validator'
import { supabaseClient } from '../../config/database'

/**
 * SRS 학습 기록 관리 라우트
 * 
 * 엔드포인트:
 * - POST /api/srs/study-records - 학습 기록 생성
 * - GET /api/srs/study-records - 학습 기록 조회
 * - GET /api/srs/study-records/:recordId - 특정 학습 기록 상세 조회
 * - GET /api/srs/study-records/analytics - 학습 기록 분석 데이터
 */
export function createSRSStudyRecordRoutes(): Router {
  const router = Router()

  // 의존성 주입 설정
  const studyRecordRepository = new SupabaseStudyRecordRepository(supabaseClient)

  // Use Case 인스턴스 생성
  const createStudyRecordUseCase = new CreateStudyRecordUseCase(
    studyRecordRepository
  )

  const getStudyRecordsUseCase = new GetStudyRecordsUseCase(
    studyRecordRepository
  )

  // Controller 인스턴스 생성
  const studyRecordController = new SRSStudyRecordController(
    createStudyRecordUseCase,
    getStudyRecordsUseCase
  )

  // 모든 라우트에 인증 미들웨어 적용
  router.use(authMiddleware)

  /**
   * POST /api/srs/study-records
   * 새로운 학습 기록 생성
   */
  router.post('/',
    rateLimitMiddleware(60, 200), // 분당 200회 제한 (학습 활동이므로 높게)
    [
      body('studentId')
        .isUUID()
        .withMessage('Student ID must be a valid UUID'),
      body('problemId')
        .isUUID()
        .withMessage('Problem ID must be a valid UUID'),
      body('feedback')
        .isIn(['AGAIN', 'HARD', 'GOOD', 'EASY'])
        .withMessage('Feedback must be one of: AGAIN, HARD, GOOD, EASY'),
      body('isCorrect')
        .isBoolean()
        .withMessage('isCorrect must be a boolean'),
      body('responseTime')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Response time must be non-negative'),
      body('answerContent')
        .optional()
        .custom((value) => {
          // 답안 내용은 다양한 형태 허용
          return true
        })
    ],
    validateRequest,
    (req: Request, res: Response) => studyRecordController.createStudyRecord(req, res)
  )

  /**
   * GET /api/srs/study-records
   * 학습 기록 조회
   */
  router.get('/',
    rateLimitMiddleware(60, 100), // 분당 100회 제한
    [
      query('studentId')
        .optional()
        .isUUID()
        .withMessage('Student ID must be a valid UUID'),
      query('problemId')
        .optional()
        .isUUID()
        .withMessage('Problem ID must be a valid UUID'),
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
        .isIn(['created_at', 'performance_score', 'response_time'])
        .withMessage('Invalid sortBy value'),
      query('sortOrder')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('Invalid sortOrder value'),
      query('fromDate')
        .optional()
        .isISO8601()
        .withMessage('fromDate must be a valid ISO 8601 date'),
      query('toDate')
        .optional()
        .isISO8601()
        .withMessage('toDate must be a valid ISO 8601 date')
    ],
    validateRequest,
    (req: Request, res: Response) => studyRecordController.getStudyRecords(req, res)
  )

  /**
   * GET /api/srs/study-records/:recordId
   * 특정 학습 기록 상세 조회
   */
  router.get('/:recordId',
    rateLimitMiddleware(60, 100), // 분당 100회 제한
    [
      param('recordId')
        .isUUID()
        .withMessage('Record ID must be a valid UUID')
    ],
    validateRequest,
    (req: Request, res: Response) => studyRecordController.getStudyRecordDetails(req, res)
  )

  /**
   * GET /api/srs/study-records/analytics
   * 학습 기록 분석 데이터 조회
   */
  router.get('/analytics',
    rateLimitMiddleware(60, 20), // 분당 20회 제한
    [
      query('period')
        .optional()
        .isInt({ min: 1, max: 365 })
        .withMessage('Period must be between 1 and 365 days'),
      query('groupBy')
        .optional()
        .isIn(['day', 'week', 'month'])
        .withMessage('Invalid groupBy value')
    ],
    validateRequest,
    (req: Request, res: Response) => studyRecordController.getStudyRecordAnalytics(req, res)
  )

  return router
}

/**
 * SRS 학습 기록 라우트를 메인 앱에 마운트하기 위한 헬퍼 함수
 */
export function mountSRSStudyRecordRoutes(app: any): void {
  const studyRecordRoutes = createSRSStudyRecordRoutes()
  
  // /api/srs/study-records 경로에 라우트 마운트
  app.use('/api/srs/study-records', studyRecordRoutes)
  
  console.log('✅ SRS Study Record routes mounted at /api/srs/study-records')
}