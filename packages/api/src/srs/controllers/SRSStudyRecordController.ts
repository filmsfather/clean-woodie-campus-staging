import { Request, Response } from 'express'
import { 
  CreateStudyRecordUseCase,
  CreateStudyRecordRequest 
} from '@woodie/application/srs/use-cases/CreateStudyRecordUseCase'
import { 
  GetStudyRecordsUseCase,
  GetStudyRecordsRequest 
} from '@woodie/application/srs/use-cases/GetStudyRecordsUseCase'
import { ReviewFeedbackType } from '@woodie/domain/srs'
import { BaseController } from '../../common/BaseController'

/**
 * SRS 학습 기록 관리 API 컨트롤러
 * 
 * 책임:
 * - 학습 기록 생성 API 제공
 * - 학습 기록 조회 API 제공
 * - 학습 이력 관리 API 제공
 * 
 * DDD/Clean Architecture 원칙:
 * - Application Layer의 Use Case에만 의존
 * - 학습 기록 생성 로직은 Domain Layer에 위임
 * - HTTP 관련 처리만 담당
 */
export class SRSStudyRecordController extends BaseController {
  constructor(
    private readonly createStudyRecordUseCase: CreateStudyRecordUseCase,
    private readonly getStudyRecordsUseCase: GetStudyRecordsUseCase
  ) {
    super()
  }

  /**
   * POST /api/srs/study-records
   * 새로운 학습 기록 생성
   */
  async createStudyRecord(req: Request, res: Response): Promise<void> {
    try {
      const authenticatedUserId = this.getUserId(req)
      
      if (!authenticatedUserId) {
        this.unauthorized(res, 'Authentication required')
        return
      }

      const {
        studentId,
        problemId,
        feedback,
        isCorrect,
        responseTime,
        answerContent
      } = req.body

      // 자신의 학습 기록만 생성 가능하도록 검증
      if (studentId !== authenticatedUserId) {
        this.forbidden(res, 'Can only create study records for yourself')
        return
      }

      // 필수 필드 검증
      if (!problemId) {
        this.clientError(res, 'Problem ID is required')
        return
      }

      if (!feedback) {
        this.clientError(res, 'Feedback is required')
        return
      }

      if (typeof isCorrect !== 'boolean') {
        this.clientError(res, 'isCorrect must be a boolean value')
        return
      }

      // 피드백 값 검증
      if (!this.isValidFeedback(feedback)) {
        this.clientError(res, 'Invalid feedback. Must be one of: AGAIN, HARD, GOOD, EASY')
        return
      }

      const request: CreateStudyRecordRequest = {
        studentId,
        problemId,
        feedback: feedback as ReviewFeedbackType,
        isCorrect,
        responseTime,
        answerContent
      }

      const result = await this.createStudyRecordUseCase.execute(request)

      if (result.isFailure) {
        this.clientError(res, result.error)
        return
      }

      const studyRecordData = result.getValue()

      this.created(res, {
        message: 'Study record created successfully',
        record: {
          recordId: studyRecordData.recordId,
          studentId: studyRecordData.studentId,
          problemId: studyRecordData.problemId,
          feedback: studyRecordData.feedback,
          isCorrect: studyRecordData.isCorrect,
          performanceScore: studyRecordData.performanceScore,
          studyPattern: studyRecordData.studyPattern,
          createdAt: studyRecordData.createdAt
        }
      })

    } catch (error) {
      console.error('Error creating study record:', error)
      this.fail(res, 'Failed to create study record')
    }
  }

  /**
   * GET /api/srs/study-records
   * 학습 기록 조회
   */
  async getStudyRecords(req: Request, res: Response): Promise<void> {
    try {
      const authenticatedUserId = this.getUserId(req)
      
      if (!authenticatedUserId) {
        this.unauthorized(res, 'Authentication required')
        return
      }

      const {
        studentId,
        problemId,
        limit = '50',
        offset = '0',
        sortBy = 'created_at',
        sortOrder = 'desc',
        fromDate,
        toDate
      } = req.query

      // 요청한 studentId가 있는 경우 권한 검증
      const targetStudentId = studentId as string || authenticatedUserId
      
      if (targetStudentId !== authenticatedUserId && !this.hasTeacherOrAdminRole(req)) {
        this.forbidden(res, 'Access denied: insufficient permissions')
        return
      }

      const parsedLimit = this.parsePositiveInteger(limit as string, 50, 100)
      const parsedOffset = this.parseNonNegativeInteger(offset as string, 0)

      const request: GetStudyRecordsRequest = {
        studentId: targetStudentId,
        problemId: problemId as string,
        fromDate: fromDate ? new Date(fromDate as string) : undefined,
        toDate: toDate ? new Date(toDate as string) : undefined,
        limit: parsedLimit,
        offset: parsedOffset
      }

      const result = await this.getStudyRecordsUseCase.execute(request)

      if (result.isFailure) {
        this.clientError(res, result.error)
        return
      }

      const studyRecordsData = result.getValue()

      this.ok(res, {
        records: studyRecordsData.records,
        pagination: {
          total: studyRecordsData.totalCount,
          limit: parsedLimit,
          offset: parsedOffset,
          hasMore: studyRecordsData.hasMore
        },
        summary: studyRecordsData.summary,
        retrievedAt: new Date().toISOString()
      })

    } catch (error) {
      console.error('Error getting study records:', error)
      this.fail(res, 'Failed to get study records')
    }
  }

  /**
   * GET /api/srs/study-records/:recordId
   * 특정 학습 기록 상세 조회
   */
  async getStudyRecordDetails(req: Request, res: Response): Promise<void> {
    try {
      const authenticatedUserId = this.getUserId(req)
      const { recordId } = req.params
      
      if (!authenticatedUserId) {
        this.unauthorized(res, 'Authentication required')
        return
      }

      if (!recordId) {
        this.clientError(res, 'Record ID is required')
        return
      }

      // 단일 기록 조회를 위한 요청 구성
      const request: GetStudyRecordsRequest = {
        studentId: authenticatedUserId,
        limit: 1,
        offset: 0
      }

      const result = await this.getStudyRecordsUseCase.execute(request)

      if (result.isFailure) {
        this.clientError(res, result.error)
        return
      }

      const studyRecordsData = result.getValue()

      if (studyRecordsData.records.length === 0) {
        this.notFound(res, 'Study record not found')
        return
      }

      const record = studyRecordsData.records[0]

      this.ok(res, {
        record: {
          recordId: record.recordId,
          studentId: record.studentId,
          problemId: record.problemId,
          feedback: record.feedback,
          isCorrect: record.isCorrect,
          responseTime: record.responseTime,
          answerContent: record.answerContent,
          performanceScore: record.performanceScore,
          studyPattern: record.studyPattern,
          createdAt: record.createdAt
        }
      })

    } catch (error) {
      console.error('Error getting study record details:', error)
      this.fail(res, 'Failed to get study record details')
    }
  }

  /**
   * GET /api/srs/study-records/analytics
   * 학습 기록 분석 데이터 조회
   */
  async getStudyRecordAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const authenticatedUserId = this.getUserId(req)
      
      if (!authenticatedUserId) {
        this.unauthorized(res, 'Authentication required')
        return
      }

      const {
        period = '30',
        groupBy = 'day'
      } = req.query

      const request: GetStudyRecordsRequest = {
        studentId: authenticatedUserId,
        fromDate: new Date(Date.now() - parseInt(period as string, 10) * 24 * 60 * 60 * 1000),
        limit: 1000, // 분석을 위한 충분한 데이터
        offset: 0
      }

      const result = await this.getStudyRecordsUseCase.execute(request)

      if (result.isFailure) {
        this.clientError(res, result.error)
        return
      }

      const studyRecordsData = result.getValue()

      this.ok(res, {
        totalRecords: studyRecordsData.totalCount,
        summary: studyRecordsData.summary,
        period: {
          days: parseInt(period as string, 10),
          groupBy: groupBy
        },
        retrievedAt: new Date().toISOString()
      })

    } catch (error) {
      console.error('Error getting study record analytics:', error)
      this.fail(res, 'Failed to get study record analytics')
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
   * 피드백 값 검증
   */
  private isValidFeedback(feedback: string): boolean {
    const validFeedbacks: ReviewFeedbackType[] = ['AGAIN', 'HARD', 'GOOD', 'EASY']
    return validFeedbacks.includes(feedback as ReviewFeedbackType)
  }

  /**
   * 정렬 필드 검증
   */
  private validateSortBy(sortBy: string): 'created_at' | 'performance_score' | 'response_time' {
    const validValues: ('created_at' | 'performance_score' | 'response_time')[] = 
      ['created_at', 'performance_score', 'response_time']
    
    if (validValues.includes(sortBy as any)) {
      return sortBy as 'created_at' | 'performance_score' | 'response_time'
    }
    
    return 'created_at' // 기본값
  }

  /**
   * 정렬 순서 검증
   */
  private validateSortOrder(sortOrder: string): 'asc' | 'desc' {
    if (sortOrder === 'asc' || sortOrder === 'desc') {
      return sortOrder
    }
    return 'desc' // 기본값
  }

  /**
   * 그룹화 기준 검증
   */
  private validateGroupBy(groupBy: string): 'day' | 'week' | 'month' {
    const validValues: ('day' | 'week' | 'month')[] = ['day', 'week', 'month']
    
    if (validValues.includes(groupBy as any)) {
      return groupBy as 'day' | 'week' | 'month'
    }
    
    return 'day' // 기본값
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

  /**
   * 0 이상의 정수 파싱
   */
  private parseNonNegativeInteger(value: string, defaultValue: number): number {
    const parsed = parseInt(value, 10)
    if (isNaN(parsed) || parsed < 0) {
      return defaultValue
    }
    return parsed
  }
}