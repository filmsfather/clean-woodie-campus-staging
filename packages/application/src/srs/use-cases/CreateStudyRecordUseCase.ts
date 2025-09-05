import { UniqueEntityID, Result, ReviewFeedback, ReviewFeedbackType, StudyRecord } from '@woodie/domain'
import { IStudyRecordRepository } from '@woodie/domain'

// Use Case 입력 DTO
export interface CreateStudyRecordRequest {
  studentId: string
  problemId: string
  feedback: ReviewFeedbackType
  isCorrect: boolean
  responseTime?: number
  answerContent?: any
}

// Use Case 출력 DTO
export interface CreateStudyRecordResponse {
  recordId: string
  studentId: string
  problemId: string
  feedback: ReviewFeedbackType
  isCorrect: boolean
  performanceScore: number
  studyPattern: {
    pattern: 'quick_correct' | 'slow_correct' | 'quick_incorrect' | 'slow_incorrect'
    confidence: number
  }
  createdAt: Date
}

/**
 * 학습 기록 생성 Use Case
 * 
 * 비즈니스 규칙:
 * - 복습 완료 후 학습 기록이 자동으로 생성됨
 * - 성과 점수가 자동 계산됨
 * - 학습 패턴이 분석되어 저장됨
 * - 생성된 기록은 불변 객체로 저장됨
 */
export class CreateStudyRecordUseCase {
  constructor(
    private studyRecordRepository: IStudyRecordRepository
  ) {}

  async execute(request: CreateStudyRecordRequest): Promise<Result<CreateStudyRecordResponse>> {
    try {
      // 1. 입력 유효성 검증
      const validationResult = this.validateRequest(request)
      if (validationResult.isFailure) {
        return Result.fail<CreateStudyRecordResponse>(validationResult.error)
      }

      // 2. 도메인 객체 생성
      const studentId = new UniqueEntityID(request.studentId)
      const problemId = new UniqueEntityID(request.problemId)
      
      const feedbackResult = ReviewFeedback.create(request.feedback)
      if (feedbackResult.isFailure) {
        return Result.fail<CreateStudyRecordResponse>(`Invalid feedback: ${feedbackResult.error}`)
      }

      const feedback = feedbackResult.getValue()

      // 3. StudyRecord 엔티티 생성
      const studyRecordResult = StudyRecord.create({
        studentId,
        problemId,
        feedback,
        isCorrect: request.isCorrect,
        responseTime: request.responseTime,
        answerContent: request.answerContent
      })

      if (studyRecordResult.isFailure) {
        return Result.fail<CreateStudyRecordResponse>(studyRecordResult.error)
      }

      const studyRecord = studyRecordResult.getValue()

      // 4. 레포지토리에 저장
      await this.studyRecordRepository.save(studyRecord)

      // 5. 응답 구성
      const response: CreateStudyRecordResponse = {
        recordId: studyRecord.id.toString(),
        studentId: studyRecord.studentId.toString(),
        problemId: studyRecord.problemId.toString(),
        feedback: studyRecord.feedback.value,
        isCorrect: studyRecord.isCorrect,
        performanceScore: studyRecord.calculatePerformanceScore(),
        studyPattern: studyRecord.getStudyPattern(),
        createdAt: studyRecord.createdAt
      }

      return Result.ok<CreateStudyRecordResponse>(response)

    } catch (error) {
      return Result.fail<CreateStudyRecordResponse>(`Failed to create study record: ${error}`)
    }
  }

  /**
   * 입력 요청 유효성 검증
   */
  private validateRequest(request: CreateStudyRecordRequest): Result<void> {
    if (!request.studentId || request.studentId.trim() === '') {
      return Result.fail<void>('Student ID is required')
    }

    if (!request.problemId || request.problemId.trim() === '') {
      return Result.fail<void>('Problem ID is required')
    }

    if (!request.feedback) {
      return Result.fail<void>('Feedback is required')
    }

    const validFeedbacks: ReviewFeedbackType[] = ['AGAIN', 'HARD', 'GOOD', 'EASY']
    if (!validFeedbacks.includes(request.feedback)) {
      return Result.fail<void>(`Invalid feedback. Must be one of: ${validFeedbacks.join(', ')}`)
    }

    if (typeof request.isCorrect !== 'boolean') {
      return Result.fail<void>('isCorrect must be a boolean value')
    }

    if (request.responseTime !== undefined && request.responseTime < 0) {
      return Result.fail<void>('Response time cannot be negative')
    }

    return Result.ok<void>()
  }
}