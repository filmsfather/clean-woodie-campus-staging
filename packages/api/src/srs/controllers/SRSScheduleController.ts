import { Request, Response } from 'express'
import { 
  CreateReviewScheduleUseCase,
  CreateReviewScheduleRequest 
} from '@woodie/application/srs/use-cases/CreateReviewScheduleUseCase'
import { 
  GetOverdueReviewsUseCase,
  GetOverdueReviewsRequest 
} from '@woodie/application/srs/use-cases/GetOverdueReviewsUseCase'
import { BaseController } from '../../common/BaseController'

/**
 * SRS 복습 스케줄 관리 API 컨트롤러
 * 
 * 책임:
 * - HTTP 요청/응답 처리
 * - 입력 데이터 검증 및 변환
 * - Use Case 호출 및 결과 반환
 * - 인증/권한 검증
 * 
 * DDD/Clean Architecture 원칙:
 * - Application Layer의 Use Case에만 의존
 * - Domain 로직은 포함하지 않음
 * - Infrastructure 세부사항에 의존하지 않음
 */
export class SRSScheduleController extends BaseController {
  constructor(
    private readonly createReviewScheduleUseCase: CreateReviewScheduleUseCase,
    private readonly getOverdueReviewsUseCase: GetOverdueReviewsUseCase
  ) {
    super()
  }

  /**
   * POST /api/srs/schedules
   * 새로운 복습 스케줄 생성
   */
  async createReviewSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { studentId, problemId } = req.body
      const authenticatedUserId = this.getUserId(req)

      if (!authenticatedUserId) {
        this.unauthorized(res, 'Authentication required')
        return
      }

      // 자신의 스케줄만 생성 가능하도록 검증 (보안 규칙)
      if (studentId !== authenticatedUserId) {
        this.forbidden(res, 'Can only create schedules for yourself')
        return
      }

      const request: CreateReviewScheduleRequest = {
        studentId,
        problemId
      }

      const result = await this.createReviewScheduleUseCase.execute(request)

      if (result.isFailure) {
        this.clientError(res, result.error)
        return
      }

      const scheduleData = result.getValue()

      this.created(res, {
        message: 'Review schedule created successfully',
        schedule: {
          scheduleId: scheduleData.scheduleId,
          studentId: scheduleData.studentId,
          problemId: scheduleData.problemId,
          nextReviewAt: scheduleData.nextReviewAt,
          initialInterval: scheduleData.initialInterval,
          initialEaseFactor: scheduleData.initialEaseFactor,
          createdAt: scheduleData.createdAt
        }
      })

    } catch (error) {
      console.error('Error creating review schedule:', error)
      this.fail(res, 'Failed to create review schedule')
    }
  }

  /**
   * GET /api/srs/schedules/overdue
   * 연체된 복습 스케줄 상세 조회 (페이지네이션, 정렬 지원)
   */
  async getDetailedOverdueReviews(req: Request, res: Response): Promise<void> {
    try {
      const authenticatedUserId = this.getUserId(req)
      
      if (!authenticatedUserId) {
        this.unauthorized(res, 'Authentication required')
        return
      }

      // 쿼리 파라미터 파싱 및 검증
      const {
        limit = '50',
        offset = '0',
        sortBy = 'overdue_duration',
        sortOrder = 'desc'
      } = req.query

      const parsedLimit = this.parsePositiveInteger(limit as string, 50, 100)
      const parsedOffset = this.parseNonNegativeInteger(offset as string, 0)

      const request: GetOverdueReviewsRequest = {
        studentId: authenticatedUserId,
        limit: parsedLimit,
        offset: parsedOffset,
        sortBy: this.validateSortBy(sortBy as string),
        sortOrder: this.validateSortOrder(sortOrder as string)
      }

      const result = await this.getOverdueReviewsUseCase.execute(request)

      if (result.isFailure) {
        this.clientError(res, result.error)
        return
      }

      const overdueData = result.getValue()

      this.ok(res, {
        studentId: overdueData.studentId,
        retrievedAt: overdueData.retrievedAt,
        items: overdueData.items,
        pagination: overdueData.pagination,
        summary: overdueData.summary,
        urgentRecommendations: overdueData.urgentRecommendations
      })

    } catch (error) {
      console.error('Error getting detailed overdue reviews:', error)
      this.fail(res, 'Failed to get overdue reviews')
    }
  }

  /**
   * 요청에서 사용자 ID 추출 (인증 미들웨어에서 설정)
   */
  private getUserId(req: Request): string | undefined {
    return (req as any).user?.id || req.headers['x-user-id'] as string
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

  /**
   * 정렬 필드 검증
   */
  private validateSortBy(sortBy: string): 'overdue_duration' | 'difficulty' | 'priority' | 'next_review_date' {
    const validValues: ('overdue_duration' | 'difficulty' | 'priority' | 'next_review_date')[] = 
      ['overdue_duration', 'difficulty', 'priority', 'next_review_date']
    
    if (validValues.includes(sortBy as any)) {
      return sortBy as 'overdue_duration' | 'difficulty' | 'priority' | 'next_review_date'
    }
    
    return 'overdue_duration' // 기본값
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
}