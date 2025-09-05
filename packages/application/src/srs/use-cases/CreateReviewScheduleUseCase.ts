import { UniqueEntityID, Result, ISpacedRepetitionPolicy, IClock } from '@woodie/domain'
import { ReviewScheduleFactory } from '@woodie/domain'

// Use Case 입력 DTO
export interface CreateReviewScheduleRequest {
  studentId: string
  problemId: string
}

// Use Case 출력 DTO
export interface CreateReviewScheduleResponse {
  scheduleId: string
  studentId: string
  problemId: string
  nextReviewAt: Date
  initialInterval: number
  initialEaseFactor: number
  createdAt: Date
}

/**
 * 복습 스케줄 생성 Use Case
 * 
 * 비즈니스 규칙:
 * - 인증된 사용자만 복습 일정을 생성할 수 있음
 * - 하나의 학생-문제 조합당 하나의 활성 스케줄만 존재
 * - 초기 복습 간격은 정책에 따라 자동 설정
 * - 스케줄 생성 시 관련 이벤트가 발행됨
 */
export class CreateReviewScheduleUseCase {
  constructor(
    private policy: ISpacedRepetitionPolicy,
    private clock: IClock
  ) {}

  async execute(request: CreateReviewScheduleRequest): Promise<Result<CreateReviewScheduleResponse>> {
    try {
      // 1. 입력 유효성 검증
      const validationResult = this.validateRequest(request)
      if (validationResult.isFailure) {
        return Result.fail<CreateReviewScheduleResponse>(validationResult.error)
      }

      // 2. 도메인 객체 생성
      const studentId = new UniqueEntityID(request.studentId)
      const problemId = new UniqueEntityID(request.problemId)

      // 3. 팩토리를 통한 복습 스케줄 생성
      const scheduleResult = ReviewScheduleFactory.create({
        studentId,
        problemId,
        policy: this.policy,
        clock: this.clock
      })

      if (scheduleResult.isFailure) {
        return Result.fail<CreateReviewScheduleResponse>(scheduleResult.error)
      }

      const schedule = scheduleResult.getValue()

      // 4. 응답 구성
      const response: CreateReviewScheduleResponse = {
        scheduleId: schedule.id.toString(),
        studentId: schedule.studentId.toString(),
        problemId: schedule.problemId.toString(),
        nextReviewAt: schedule.nextReviewAt,
        initialInterval: schedule.currentInterval,
        initialEaseFactor: schedule.easeFactor,
        createdAt: schedule.createdAt
      }

      return Result.ok<CreateReviewScheduleResponse>(response)

    } catch (error) {
      return Result.fail<CreateReviewScheduleResponse>(`Failed to create review schedule: ${error}`)
    }
  }

  /**
   * 입력 요청 유효성 검증
   */
  private validateRequest(request: CreateReviewScheduleRequest): Result<void> {
    if (!request.studentId || request.studentId.trim() === '') {
      return Result.fail<void>('Student ID is required')
    }

    if (!request.problemId || request.problemId.trim() === '') {
      return Result.fail<void>('Problem ID is required')
    }

    return Result.ok<void>()
  }
}