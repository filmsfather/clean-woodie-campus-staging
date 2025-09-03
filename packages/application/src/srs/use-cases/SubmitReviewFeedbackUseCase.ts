import { UniqueEntityID, Result, ReviewFeedback, ReviewFeedbackType } from '@woodie/domain'
import { ReviewQueueService, ReviewCompletionResult } from '../services/ReviewQueueService'

// Use Case 입력 DTO
export interface SubmitReviewFeedbackRequest {
  studentId: string
  scheduleId: string
  feedback: ReviewFeedbackType
  responseTime?: number // 초 단위
  answerContent?: any   // 사용자가 입력한 답안 내용
  metadata?: {
    questionType?: string
    difficulty?: string
    tags?: string[]
  }
}

// Use Case 출력 DTO  
export interface SubmitReviewFeedbackResponse {
  success: boolean
  result: ReviewCompletionResult
  nextReview?: {
    intervalDays: number
    scheduledAt: Date
    difficultyChange: 'easier' | 'harder' | 'same'
  }
  achievements?: {
    streakMilestone?: boolean
    retentionImprovement?: boolean
    speedImprovement?: boolean
  }
}

/**
 * 복습 피드백 제출 Use Case
 * 
 * 비즈니스 규칙:
 * - 인증된 사용자만 자신의 복습에 피드백을 제출할 수 있음
 * - 피드백 제출 시 즉시 다음 복습 일정이 계산됨
 * - 연속 성공/실패 기록이 업데이트됨
 * - 성취도 및 마일스톤이 평가됨
 * - 복습 완료 이벤트가 발행되어 학습 기록이 생성됨
 */
export class SubmitReviewFeedbackUseCase {
  constructor(
    private reviewQueueService: ReviewQueueService
  ) {}

  async execute(request: SubmitReviewFeedbackRequest): Promise<Result<SubmitReviewFeedbackResponse>> {
    try {
      // 1. 입력 유효성 검증
      const validationResult = this.validateRequest(request)
      if (validationResult.isFailure) {
        return Result.fail<SubmitReviewFeedbackResponse>(validationResult.error)
      }

      // 2. 도메인 객체 생성
      const studentId = new UniqueEntityID(request.studentId)
      const scheduleId = new UniqueEntityID(request.scheduleId)
      
      const feedbackResult = ReviewFeedback.create(request.feedback)
      if (feedbackResult.isFailure) {
        return Result.fail<SubmitReviewFeedbackResponse>(`Invalid feedback: ${feedbackResult.error}`)
      }

      const feedback = feedbackResult.getValue()

      // 3. 복습 완료 처리
      const completionResult = await this.reviewQueueService.markReviewCompleted(
        studentId,
        scheduleId,
        feedback,
        request.responseTime,
        request.answerContent
      )

      if (completionResult.isFailure) {
        return Result.fail<SubmitReviewFeedbackResponse>(completionResult.error)
      }

      const completion = completionResult.getValue()

      // 4. 다음 복습 정보 계산
      const nextReview = this.calculateNextReviewInfo(completion)

      // 5. 성취도 평가 (간단한 예시)
      const achievements = this.evaluateAchievements(completion, feedback)

      // 6. 응답 구성
      const response: SubmitReviewFeedbackResponse = {
        success: true,
        result: completion,
        nextReview,
        achievements
      }

      return Result.ok<SubmitReviewFeedbackResponse>(response)

    } catch (error) {
      return Result.fail<SubmitReviewFeedbackResponse>(`Failed to submit review feedback: ${error}`)
    }
  }

  /**
   * 입력 요청 유효성 검증
   */
  private validateRequest(request: SubmitReviewFeedbackRequest): Result<void> {
    if (!request.studentId || request.studentId.trim() === '') {
      return Result.fail<void>('Student ID is required')
    }

    if (!request.scheduleId || request.scheduleId.trim() === '') {
      return Result.fail<void>('Schedule ID is required')
    }

    if (!request.feedback) {
      return Result.fail<void>('Feedback is required')
    }

    const validFeedbacks: ReviewFeedbackType[] = ['AGAIN', 'HARD', 'GOOD', 'EASY']
    if (!validFeedbacks.includes(request.feedback)) {
      return Result.fail<void>(`Invalid feedback. Must be one of: ${validFeedbacks.join(', ')}`)
    }

    if (request.responseTime !== undefined && request.responseTime < 0) {
      return Result.fail<void>('Response time cannot be negative')
    }

    return Result.ok<void>()
  }

  /**
   * 다음 복습 정보 계산
   */
  private calculateNextReviewInfo(completion: ReviewCompletionResult): {
    intervalDays: number
    scheduledAt: Date
    difficultyChange: 'easier' | 'harder' | 'same'
  } {
    const intervalDays = completion.newInterval
    const scheduledAt = completion.nextReviewAt

    // 난이도 변화 계산
    let difficultyChange: 'easier' | 'harder' | 'same' = 'same'
    
    if (completion.newEaseFactor > completion.previousEaseFactor) {
      difficultyChange = 'easier'
    } else if (completion.newEaseFactor < completion.previousEaseFactor) {
      difficultyChange = 'harder'
    }

    return {
      intervalDays,
      scheduledAt,
      difficultyChange
    }
  }

  /**
   * 성취도 평가 (간단한 로직)
   */
  private evaluateAchievements(
    completion: ReviewCompletionResult, 
    feedback: ReviewFeedback
  ): {
    streakMilestone?: boolean
    retentionImprovement?: boolean
    speedImprovement?: boolean
  } {
    const achievements: any = {}

    // 연속 성공 마일스톤 (5회, 10회, 25회, 50회, 100회)
    const streakMilestones = [5, 10, 25, 50, 100]
    if (streakMilestones.includes(completion.reviewCount)) {
      achievements.streakMilestone = true
    }

    // 기억 보존 개선 (ease factor 증가)
    if (completion.newEaseFactor > completion.previousEaseFactor) {
      achievements.retentionImprovement = true
    }

    // 빠른 응답 (EASY 피드백으로 추정)
    if (feedback.isEasy()) {
      achievements.speedImprovement = true
    }

    return achievements
  }
}