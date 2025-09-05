import { UniqueEntityID, Result, StudyRecord } from '@woodie/domain'
import { IStudyRecordRepository } from '@woodie/domain'

// Use Case 입력 DTO
export interface GetStudyRecordsRequest {
  studentId: string
  problemId?: string
  fromDate?: Date
  toDate?: Date
  limit?: number
  offset?: number
}

// Use Case 출력 DTO
export interface StudyRecordDTO {
  recordId: string
  studentId: string
  problemId: string
  feedback: string
  isCorrect: boolean
  responseTime?: number
  answerContent?: any
  performanceScore: number
  studyPattern: {
    pattern: 'quick_correct' | 'slow_correct' | 'quick_incorrect' | 'slow_incorrect'
    confidence: number
  }
  createdAt: Date
}

export interface GetStudyRecordsResponse {
  records: StudyRecordDTO[]
  totalCount: number
  hasMore: boolean
  summary: {
    totalRecords: number
    correctAnswers: number
    incorrectAnswers: number
    averageResponseTime?: number
    averagePerformanceScore: number
  }
}

/**
 * 학습 기록 조회 Use Case
 * 
 * 비즈니스 규칙:
 * - 인증된 사용자만 자신의 학습 기록을 조회할 수 있음
 * - 기간별, 문제별 필터링 지원
 * - 페이지네이션 지원
 * - 요약 통계 정보 제공
 */
export class GetStudyRecordsUseCase {
  constructor(
    private studyRecordRepository: IStudyRecordRepository
  ) {}

  async execute(request: GetStudyRecordsRequest): Promise<Result<GetStudyRecordsResponse>> {
    try {
      // 1. 입력 유효성 검증
      const validationResult = this.validateRequest(request)
      if (validationResult.isFailure) {
        return Result.fail<GetStudyRecordsResponse>(validationResult.error)
      }

      const studentId = new UniqueEntityID(request.studentId)
      const problemId = request.problemId ? new UniqueEntityID(request.problemId) : undefined

      // 2. 레포지토리에서 학습 기록 조회
      let records
      if (request.fromDate && request.toDate) {
        records = await this.studyRecordRepository.findByDateRange(
          studentId, request.fromDate, request.toDate
        )
      } else {
        records = await this.studyRecordRepository.findByStudentId(studentId, request.limit || 50)
      }

      // 3. 전체 개수 조회
      const totalCount = await this.studyRecordRepository.countByStudentId(studentId)

      // 4. DTO 변환
      const recordDTOs = records.map(record => this.toDTO(record))

      // 5. 요약 통계 계산
      const summary = this.calculateSummary(records)

      // 6. 응답 구성
      const response: GetStudyRecordsResponse = {
        records: recordDTOs,
        totalCount,
        hasMore: (request.offset || 0) + recordDTOs.length < totalCount,
        summary
      }

      return Result.ok<GetStudyRecordsResponse>(response)

    } catch (error) {
      return Result.fail<GetStudyRecordsResponse>(`Failed to get study records: ${error}`)
    }
  }

  /**
   * 입력 요청 유효성 검증
   */
  private validateRequest(request: GetStudyRecordsRequest): Result<void> {
    if (!request.studentId || request.studentId.trim() === '') {
      return Result.fail<void>('Student ID is required')
    }

    if (request.limit !== undefined && request.limit <= 0) {
      return Result.fail<void>('Limit must be a positive number')
    }

    if (request.offset !== undefined && request.offset < 0) {
      return Result.fail<void>('Offset cannot be negative')
    }

    if (request.fromDate && request.toDate && request.fromDate > request.toDate) {
      return Result.fail<void>('From date cannot be later than to date')
    }

    return Result.ok<void>()
  }

  /**
   * Domain 객체를 DTO로 변환
   */
  private toDTO(record: StudyRecord): StudyRecordDTO {
    return {
      recordId: record.id.toString(),
      studentId: record.studentId.toString(),
      problemId: record.problemId.toString(),
      feedback: record.feedback.value,
      isCorrect: record.isCorrect,
      responseTime: record.responseTime,
      performanceScore: record.calculatePerformanceScore(),
      studyPattern: record.getStudyPattern(),
      createdAt: record.createdAt
    }
  }

  /**
   * 요약 통계 계산
   */
  private calculateSummary(records: StudyRecord[]): {
    totalRecords: number
    correctAnswers: number
    incorrectAnswers: number
    averageResponseTime?: number
    averagePerformanceScore: number
  } {
    const totalRecords = records.length
    const correctAnswers = records.filter(r => r.isCorrect).length
    const incorrectAnswers = totalRecords - correctAnswers

    // 응답 시간이 있는 기록들의 평균 계산
    const recordsWithResponseTime = records.filter(r => r.responseTime !== undefined)
    const averageResponseTime = recordsWithResponseTime.length > 0
      ? recordsWithResponseTime.reduce((sum, r) => sum + (r.responseTime || 0), 0) / recordsWithResponseTime.length
      : undefined

    // 평균 성과 점수 계산
    const averagePerformanceScore = totalRecords > 0
      ? records.reduce((sum, r) => sum + r.calculatePerformanceScore(), 0) / totalRecords
      : 0

    return {
      totalRecords,
      correctAnswers,
      incorrectAnswers,
      averageResponseTime,
      averagePerformanceScore: Math.round(averagePerformanceScore * 100) / 100
    }
  }
}