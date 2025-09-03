import { UniqueEntityID } from '@domain/common/Identifier'
import { Result } from '@domain/common/Result'
import { ReviewQueueService, ReviewQueueItem } from '../services/ReviewQueueService'

// Use Case 입력 DTO
export interface GetTodayReviewsRequest {
  studentId: string
}

// Use Case 출력 DTO
export interface GetTodayReviewsResponse {
  reviews: ReviewQueueItem[]
  totalCount: number
  highPriorityCount: number
  overdueCount: number
  upcomingCount: number
}

/**
 * 오늘의 복습 항목 조회 Use Case
 * 
 * 비즈니스 규칙:
 * - 인증된 사용자만 자신의 복습 항목을 조회할 수 있음
 * - 우선순위별로 정렬된 복습 항목 반환
 * - 연체된 항목이 최우선으로 표시됨
 * - 통계 정보도 함께 제공
 */
export class GetTodayReviewsUseCase {
  constructor(
    private reviewQueueService: ReviewQueueService
  ) {}

  async execute(request: GetTodayReviewsRequest): Promise<Result<GetTodayReviewsResponse>> {
    try {
      // 1. 입력 유효성 검증
      if (!request.studentId || request.studentId.trim() === '') {
        return Result.fail<GetTodayReviewsResponse>('Student ID is required')
      }

      const studentId = new UniqueEntityID(request.studentId)

      // 2. 오늘의 복습 항목 조회
      const reviewsResult = await this.reviewQueueService.getTodayReviews(studentId)
      if (reviewsResult.isFailure) {
        return Result.fail<GetTodayReviewsResponse>(reviewsResult.error)
      }

      const reviews = reviewsResult.getValue()

      // 3. 통계 계산
      const totalCount = reviews.length
      const highPriorityCount = reviews.filter(review => review.priority === 'high').length
      const overdueCount = reviews.filter(review => review.isOverdue).length
      const upcomingCount = reviews.filter(review => 
        !review.isOverdue && review.minutesUntilDue > 0 && review.minutesUntilDue <= 60
      ).length

      // 4. 응답 구성
      const response: GetTodayReviewsResponse = {
        reviews,
        totalCount,
        highPriorityCount,
        overdueCount,
        upcomingCount
      }

      return Result.ok<GetTodayReviewsResponse>(response)

    } catch (error) {
      return Result.fail<GetTodayReviewsResponse>(`Failed to get today reviews: ${error}`)
    }
  }
}