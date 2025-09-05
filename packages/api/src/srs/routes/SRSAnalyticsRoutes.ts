import { Router, Request, Response } from 'express'
import { SRSAnalyticsController } from '../controllers/SRSAnalyticsController'
import { 
  AnalyzeStudyPatternsUseCase,
  AssessDifficultyLevelUseCase,
  GetProblemReviewPerformanceUseCase,
  GetRetentionProbabilityUseCase,
  GetStudentReviewStatsUseCase,
  GetReviewStatisticsUseCase
} from '@woodie/application/srs/use-cases/index'
import { 
  SupabaseStudyRecordRepository,
  SupabaseReviewScheduleRepository,
  NotificationSenderService
} from '@woodie/infrastructure/srs/index'
import { SystemClock } from '@woodie/infrastructure'
import { ReviewQueueService } from '@woodie/application/srs/services/ReviewQueueService'
import { authMiddleware } from '../../middleware/AuthMiddleware'
import { validateRequest } from '../../middleware/ValidationMiddleware'
import { rateLimitMiddleware } from '../../middleware/RateLimitMiddleware'
import { body, param, query } from 'express-validator'
import { supabaseClient } from '../../config/database'

/**
 * SRS 분석 및 통계 라우트
 * 
 * 엔드포인트:
 * - GET /api/srs/analysis/study-patterns - 학습 패턴 분석
 * - POST /api/srs/analysis/difficulty-assessment - 문제 난이도 평가
 * - GET /api/srs/problems/:problemId/performance - 문제별 성과 조회
 * - GET /api/srs/retention-probability - 기억 보존 확률 계산
 * - GET /api/srs/students/:studentId/review-stats - 학생별 복습 통계
 * - GET /api/srs/statistics/comprehensive - 종합 통계 조회
 */
export function createSRSAnalyticsRoutes(): Router {
  const router = Router()

  // 의존성 주입 설정
  const clock = new SystemClock()
  const studyRecordRepository = new SupabaseStudyRecordRepository(supabaseClient)
  const reviewScheduleRepository = new SupabaseReviewScheduleRepository(supabaseClient)
  
  // Service 인스턴스 생성 (실제 구현에서는 더 많은 의존성 필요)
  const reviewQueueService = new ReviewQueueService(
    reviewScheduleRepository,
    studyRecordRepository,
    /* spacedRepetitionPolicy */ null as any, // TODO: 실제 구현 필요
    clock
  )

  const notificationSenderService = null as any // TODO: 실제 구현 필요

  // Use Case 인스턴스 생성 (실제 구현에서는 더 많은 의존성 필요)
  const analyzeStudyPatternsUseCase = new AnalyzeStudyPatternsUseCase(
    studyRecordRepository
  )

  const assessDifficultyLevelUseCase = new AssessDifficultyLevelUseCase(
    reviewScheduleRepository,
    studyRecordRepository
  )

  const getProblemReviewPerformanceUseCase = new GetProblemReviewPerformanceUseCase(
    reviewScheduleRepository,
    studyRecordRepository
  )

  const getRetentionProbabilityUseCase = new GetRetentionProbabilityUseCase(
    reviewScheduleRepository,
    clock
  )

  const getStudentReviewStatsUseCase = new GetStudentReviewStatsUseCase(
    reviewScheduleRepository,
    studyRecordRepository
  )

  const getReviewStatisticsUseCase = new GetReviewStatisticsUseCase(
    reviewQueueService,
    notificationSenderService
  )

  // Controller 인스턴스 생성
  const analyticsController = new SRSAnalyticsController(
    analyzeStudyPatternsUseCase,
    assessDifficultyLevelUseCase,
    getProblemReviewPerformanceUseCase,
    getRetentionProbabilityUseCase,
    getStudentReviewStatsUseCase,
    getReviewStatisticsUseCase
  )

  // 모든 라우트에 인증 미들웨어 적용
  router.use(authMiddleware)

  /**
   * GET /api/srs/analysis/study-patterns
   * 학습 패턴 분석
   */
  router.get('/analysis/study-patterns',
    rateLimitMiddleware(60, 20), // 분당 20회 제한
    [
      query('period')
        .optional()
        .isIn(['today', 'week', 'month', 'all'])
        .withMessage('Invalid period value'),
      query('includeComparisons')
        .optional()
        .isBoolean()
        .withMessage('includeComparisons must be boolean'),
      query('analysisDepth')
        .optional()
        .isIn(['basic', 'standard', 'detailed'])
        .withMessage('Invalid analysisDepth value')
    ],
    validateRequest,
    (req: Request, res: Response) => analyticsController.analyzeStudyPatterns(req, res)
  )

  /**
   * POST /api/srs/analysis/difficulty-assessment
   * 문제 난이도 평가
   */
  router.post('/analysis/difficulty-assessment',
    rateLimitMiddleware(60, 30), // 분당 30회 제한
    [
      body('problemId')
        .isUUID()
        .withMessage('Problem ID must be a valid UUID'),
      body('performanceData')
        .optional()
        .isObject()
        .withMessage('Performance data must be an object')
    ],
    validateRequest,
    (req: Request, res: Response) => analyticsController.assessDifficultyLevel(req, res)
  )

  /**
   * GET /api/srs/problems/:problemId/performance
   * 문제별 복습 성과 조회
   */
  router.get('/problems/:problemId/performance',
    rateLimitMiddleware(60, 50), // 분당 50회 제한
    [
      param('problemId')
        .isUUID()
        .withMessage('Problem ID must be a valid UUID'),
      query('includeStudents')
        .optional()
        .isBoolean()
        .withMessage('includeStudents must be boolean'),
      query('timeRange')
        .optional()
        .isInt({ min: 1, max: 365 })
        .withMessage('timeRange must be between 1 and 365 days')
    ],
    validateRequest,
    (req: Request, res: Response) => analyticsController.getProblemReviewPerformance(req, res)
  )

  /**
   * GET /api/srs/retention-probability
   * 기억 보존 확률 계산
   */
  router.get('/retention-probability',
    rateLimitMiddleware(60, 100), // 분당 100회 제한
    [
      query('problemId')
        .optional()
        .isUUID()
        .withMessage('Problem ID must be a valid UUID'),
      query('predictionDays')
        .optional()
        .isInt({ min: 1, max: 365 })
        .withMessage('predictionDays must be between 1 and 365')
    ],
    validateRequest,
    (req: Request, res: Response) => analyticsController.getRetentionProbability(req, res)
  )

  /**
   * GET /api/srs/students/:studentId/review-stats
   * 특정 학생의 복습 통계 (교사/관리자용)
   */
  router.get('/students/:studentId/review-stats',
    rateLimitMiddleware(60, 50), // 분당 50회 제한
    [
      param('studentId')
        .isUUID()
        .withMessage('Student ID must be a valid UUID'),
      query('period')
        .optional()
        .isIn(['today', 'week', 'month', 'all'])
        .withMessage('Invalid period value'),
      query('includeDetails')
        .optional()
        .isBoolean()
        .withMessage('includeDetails must be boolean')
    ],
    validateRequest,
    (req: Request, res: Response) => analyticsController.getStudentReviewStats(req, res)
  )

  /**
   * GET /api/srs/statistics/comprehensive
   * 종합 복습 통계 조회
   */
  router.get('/statistics/comprehensive',
    rateLimitMiddleware(60, 30), // 분당 30회 제한
    [
      query('period')
        .optional()
        .isIn(['today', 'week', 'month', 'all'])
        .withMessage('Invalid period value'),
      query('includeNotifications')
        .optional()
        .isBoolean()
        .withMessage('includeNotifications must be boolean')
    ],
    validateRequest,
    (req: Request, res: Response) => analyticsController.getComprehensiveStatistics(req, res)
  )

  return router
}

/**
 * SRS 분석 라우트를 메인 앱에 마운트하기 위한 헬퍼 함수
 */
export function mountSRSAnalyticsRoutes(app: any): void {
  const analyticsRoutes = createSRSAnalyticsRoutes()
  
  // /api/srs 경로에 라우트 마운트
  app.use('/api/srs', analyticsRoutes)
  
  console.log('✅ SRS Analytics routes mounted at /api/srs')
}