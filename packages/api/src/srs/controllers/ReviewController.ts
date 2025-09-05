import { Request, Response } from 'express'
import { 
  GetTodayReviewsUseCase,
  GetTodayReviewsRequest 
} from '@woodie/application/srs/use-cases/GetTodayReviewsUseCase'
import { 
  SubmitReviewFeedbackUseCase,
  SubmitReviewFeedbackRequest 
} from '@woodie/application/srs/use-cases/SubmitReviewFeedbackUseCase'
import { ReviewFeedbackType } from '@woodie/domain/srs'
import { BaseController } from '../../common/BaseController'

/**
 * SRS 복습 큐 및 피드백 API 컨트롤러 (리팩토링됨)
 * 
 * 책임:
 * - 복습 큐 조회 API 제공
 * - 복습 피드백 제출 API 제공
 * 
 * DDD/Clean Architecture 원칙:
 * - Application Layer의 Use Case에만 의존
 * - 단일 책임 원칙 준수 (복습 관련 핵심 기능만)
 * - 알림 관련 기능은 SRSNotificationController로 이관
 * - 통계 관련 기능은 SRSAnalyticsController로 이관
 */
export class ReviewController extends BaseController {
  constructor(
    private readonly getTodayReviewsUseCase: GetTodayReviewsUseCase,
    private readonly submitReviewFeedbackUseCase: SubmitReviewFeedbackUseCase
  ) {
    super()
  }

  /**
   * GET /api/srs/reviews/today
   * 오늘의 복습 항목 조회 (우선순위별 정렬)
   */
  async getTodayReviews(req: Request, res: Response): Promise<void> {
    try {
      const authenticatedUserId = this.getUserId(req)
      
      if (!authenticatedUserId) {
        this.unauthorized(res, 'Authentication required')
        return
      }

      const request: GetTodayReviewsRequest = {
        studentId: authenticatedUserId
      }

      const result = await this.getTodayReviewsUseCase.execute(request)

      if (result.isFailure) {
        this.clientError(res, result.error)
        return
      }

      const reviewsData = result.getValue()

      this.ok(res, {
        reviews: reviewsData.reviews,
        totalCount: reviewsData.totalCount,
        highPriorityCount: reviewsData.highPriorityCount,
        overdueCount: reviewsData.overdueCount,
        upcomingCount: reviewsData.upcomingCount
      })

    } catch (error) {
      console.error('Error getting today reviews:', error)
      this.fail(res, 'Failed to get today reviews')
    }
  }


  /**
   * POST /api/srs/reviews/:scheduleId/feedback
   * 복습 피드백 제출
   */
  async submitReviewFeedback(req: Request, res: Response): Promise<void> {
    try {
      const authenticatedUserId = this.getUserId(req)
      const { scheduleId } = req.params
      const { feedback, responseTime, answerContent } = req.body

      if (!authenticatedUserId) {
        this.unauthorized(res, 'Authentication required')
        return
      }

      if (!scheduleId) {
        this.clientError(res, 'Schedule ID is required')
        return
      }

      if (!feedback) {
        this.clientError(res, 'Feedback is required')
        return
      }

      // 피드백 값 검증
      if (!this.isValidFeedback(feedback)) {
        this.clientError(res, 'Invalid feedback. Must be one of: AGAIN, HARD, GOOD, EASY')
        return
      }

      const request: SubmitReviewFeedbackRequest = {
        studentId: authenticatedUserId,
        scheduleId,
        feedback: feedback as ReviewFeedbackType,
        responseTime,
        answerContent
      }

      const result = await this.submitReviewFeedbackUseCase.execute(request)

      if (result.isFailure) {
        this.clientError(res, result.error)
        return
      }

      const feedbackData = result.getValue()

      this.ok(res, {
        message: 'Review feedback submitted successfully',
        success: feedbackData.success,
        result: feedbackData.result,
        nextReview: feedbackData.nextReview,
        achievements: feedbackData.achievements
      })

    } catch (error) {
      console.error('Error submitting review feedback:', error)
      this.fail(res, 'Failed to submit review feedback')
    }
  }


  /**
   * 요청에서 사용자 ID 추출 (인증 미들웨어에서 설정)
   */
  private getUserId(req: Request): string | undefined {
    return (req as any).user?.id || req.headers['x-user-id'] as string
  }

  /**
   * 피드백 값 검증
   */
  private isValidFeedback(feedback: string): boolean {
    const validFeedbacks: ReviewFeedbackType[] = ['AGAIN', 'HARD', 'GOOD', 'EASY']
    return validFeedbacks.includes(feedback as ReviewFeedbackType)
  }
}