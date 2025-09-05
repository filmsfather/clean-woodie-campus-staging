import { Request, Response } from 'express'
import { 
  AnalyzeStudyPatternsUseCase,
  AnalyzeStudyPatternsRequest 
} from '@woodie/application/srs/use-cases/AnalyzeStudyPatternsUseCase'
import { 
  AssessDifficultyLevelUseCase,
  AssessDifficultyLevelRequest 
} from '@woodie/application/srs/use-cases/AssessDifficultyLevelUseCase'
import { 
  GetProblemReviewPerformanceUseCase,
  GetProblemReviewPerformanceRequest 
} from '@woodie/application/srs/use-cases/GetProblemReviewPerformanceUseCase'
import { 
  GetRetentionProbabilityUseCase,
  GetRetentionProbabilityRequest 
} from '@woodie/application/srs/use-cases/GetRetentionProbabilityUseCase'
import { 
  GetStudentReviewStatsUseCase,
  GetStudentReviewStatsRequest 
} from '@woodie/application/srs/use-cases/GetStudentReviewStatsUseCase'
import { 
  GetReviewStatisticsUseCase,
  GetReviewStatisticsRequest 
} from '@woodie/application/srs/use-cases/GetReviewStatisticsUseCase'
import { BaseController } from '../../common/BaseController'

/**
 * SRS 분석 및 통계 API 컨트롤러
 * 
 * 책임:
 * - 학습 패턴 분석 API 제공
 * - 문제 난이도 평가 API 제공
 * - 복습 성과 통계 API 제공
 * - 기억 보존 확률 분석 API 제공
 * 
 * DDD/Clean Architecture 원칙:
 * - Application Layer의 Use Case에만 의존
 * - 분석 로직은 Domain/Application Layer에 위임
 * - HTTP 관련 처리만 담당
 */
export class SRSAnalyticsController extends BaseController {
  constructor(
    private readonly analyzeStudyPatternsUseCase: AnalyzeStudyPatternsUseCase,
    private readonly assessDifficultyLevelUseCase: AssessDifficultyLevelUseCase,
    private readonly getProblemReviewPerformanceUseCase: GetProblemReviewPerformanceUseCase,
    private readonly getRetentionProbabilityUseCase: GetRetentionProbabilityUseCase,
    private readonly getStudentReviewStatsUseCase: GetStudentReviewStatsUseCase,
    private readonly getReviewStatisticsUseCase: GetReviewStatisticsUseCase
  ) {
    super()
  }

  /**
   * GET /api/srs/analysis/study-patterns
   * 학습 패턴 분석
   */
  async analyzeStudyPatterns(req: Request, res: Response): Promise<void> {
    try {
      const authenticatedUserId = this.getUserId(req)
      
      if (!authenticatedUserId) {
        this.unauthorized(res, 'Authentication required')
        return
      }

      const {
        period = 'month',
        includeComparisons = 'false',
        analysisDepth = 'standard'
      } = req.query

      const request: AnalyzeStudyPatternsRequest = {
        studentId: authenticatedUserId,
        timeRangeInDays: 30
      }

      const result = await this.analyzeStudyPatternsUseCase.execute(request)

      if (result.isFailure) {
        this.clientError(res, result.error)
        return
      }

      this.ok(res, result.getValue())

    } catch (error) {
      console.error('Error analyzing study patterns:', error)
      this.fail(res, 'Failed to analyze study patterns')
    }
  }

  /**
   * POST /api/srs/analysis/difficulty-assessment
   * 문제 난이도 평가
   */
  async assessDifficultyLevel(req: Request, res: Response): Promise<void> {
    try {
      const authenticatedUserId = this.getUserId(req)
      const { problemId, performanceData } = req.body

      if (!authenticatedUserId) {
        this.unauthorized(res, 'Authentication required')
        return
      }

      if (!problemId) {
        this.clientError(res, 'Problem ID is required')
        return
      }

      const request: AssessDifficultyLevelRequest = {
        studentId: authenticatedUserId,
        problemId,
        includeRecommendations: true
      }

      const result = await this.assessDifficultyLevelUseCase.execute(request)

      if (result.isFailure) {
        this.clientError(res, result.error)
        return
      }

      this.ok(res, result.getValue())

    } catch (error) {
      console.error('Error assessing difficulty level:', error)
      this.fail(res, 'Failed to assess difficulty level')
    }
  }

  /**
   * GET /api/srs/problems/:problemId/performance
   * 문제별 복습 성과 조회
   */
  async getProblemReviewPerformance(req: Request, res: Response): Promise<void> {
    try {
      const authenticatedUserId = this.getUserId(req)
      const { problemId } = req.params

      if (!authenticatedUserId) {
        this.unauthorized(res, 'Authentication required')
        return
      }

      if (!problemId) {
        this.clientError(res, 'Problem ID is required')
        return
      }

      const {
        includeStudents = 'false',
        timeRange = '30'
      } = req.query

      const request: GetProblemReviewPerformanceRequest = {
        problemId,
        includeStudentBreakdown: this.parseBoolean(includeStudents as string),
        timeRangeInDays: this.parsePositiveInteger(timeRange as string, 30, 365)
      }

      const result = await this.getProblemReviewPerformanceUseCase.execute(request)

      if (result.isFailure) {
        this.clientError(res, result.error)
        return
      }

      this.ok(res, result.getValue())

    } catch (error) {
      console.error('Error getting problem review performance:', error)
      this.fail(res, 'Failed to get problem review performance')
    }
  }

  /**
   * GET /api/srs/retention-probability
   * 기억 보존 확률 계산
   */
  async getRetentionProbability(req: Request, res: Response): Promise<void> {
    try {
      const authenticatedUserId = this.getUserId(req)
      
      if (!authenticatedUserId) {
        this.unauthorized(res, 'Authentication required')
        return
      }

      const {
        problemId,
        predictionDays = '7'
      } = req.query

      const request: GetRetentionProbabilityRequest = {
        studentId: authenticatedUserId,
        problemId: problemId as string
      }

      const result = await this.getRetentionProbabilityUseCase.execute(request)

      if (result.isFailure) {
        this.clientError(res, result.error)
        return
      }

      this.ok(res, result.getValue())

    } catch (error) {
      console.error('Error getting retention probability:', error)
      this.fail(res, 'Failed to get retention probability')
    }
  }

  /**
   * GET /api/srs/students/:studentId/review-stats
   * 특정 학생의 복습 통계 (교사/관리자용)
   */
  async getStudentReviewStats(req: Request, res: Response): Promise<void> {
    try {
      const authenticatedUserId = this.getUserId(req)
      const { studentId } = req.params

      if (!authenticatedUserId) {
        this.unauthorized(res, 'Authentication required')
        return
      }

      // 자신의 통계이거나 교사/관리자 권한이 있는 경우만 허용
      if (studentId !== authenticatedUserId && !this.hasTeacherOrAdminRole(req)) {
        this.forbidden(res, 'Access denied: insufficient permissions')
        return
      }

      const {
        period = 'month',
        includeDetails = 'true'
      } = req.query

      const request: GetStudentReviewStatsRequest = {
        studentId,
        includeTrends: this.parseBoolean(includeDetails as string),
        includePerformanceMetrics: true
      }

      const result = await this.getStudentReviewStatsUseCase.execute(request)

      if (result.isFailure) {
        this.clientError(res, result.error)
        return
      }

      this.ok(res, result.getValue())

    } catch (error) {
      console.error('Error getting student review stats:', error)
      this.fail(res, 'Failed to get student review stats')
    }
  }

  /**
   * GET /api/srs/statistics/comprehensive
   * 종합 복습 통계 조회
   */
  async getComprehensiveStatistics(req: Request, res: Response): Promise<void> {
    try {
      const authenticatedUserId = this.getUserId(req)
      
      if (!authenticatedUserId) {
        this.unauthorized(res, 'Authentication required')
        return
      }

      const {
        period = 'all',
        includeNotifications = 'true'
      } = req.query

      const request: GetReviewStatisticsRequest = {
        studentId: authenticatedUserId,
        period: this.validatePeriod(period as string),
        includeNotifications: this.parseBoolean(includeNotifications as string)
      }

      const result = await this.getReviewStatisticsUseCase.execute(request)

      if (result.isFailure) {
        this.clientError(res, result.error)
        return
      }

      this.ok(res, result.getValue())

    } catch (error) {
      console.error('Error getting comprehensive statistics:', error)
      this.fail(res, 'Failed to get comprehensive statistics')
    }
  }

  /**
   * 요청에서 사용자 ID 추출
   */
  private getUserId(req: Request): string | undefined {
    return (req as any).user?.id || req.headers['x-user-id'] as string
  }

  /**
   * 교사/관리자 권한 검증
   */
  private hasTeacherOrAdminRole(req: Request): boolean {
    const userRole = (req as any).user?.role || req.headers['x-user-role'] as string
    return userRole === 'teacher' || userRole === 'admin'
  }

  /**
   * 기간 값 검증
   */
  private validatePeriod(period: string): 'today' | 'week' | 'month' | 'all' {
    const validPeriods: ('today' | 'week' | 'month' | 'all')[] = ['today', 'week', 'month', 'all']
    if (validPeriods.includes(period as any)) {
      return period as 'today' | 'week' | 'month' | 'all'
    }
    return 'all'
  }

  /**
   * 분석 깊이 검증
   */
  private validateAnalysisDepth(depth: string): 'basic' | 'standard' | 'detailed' {
    const validDepths: ('basic' | 'standard' | 'detailed')[] = ['basic', 'standard', 'detailed']
    if (validDepths.includes(depth as any)) {
      return depth as 'basic' | 'standard' | 'detailed'
    }
    return 'standard'
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