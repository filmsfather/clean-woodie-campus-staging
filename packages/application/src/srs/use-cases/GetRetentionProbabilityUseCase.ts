import { UniqueEntityID, Result, IClock } from '@woodie/domain'
import { IReviewScheduleRepository } from '@woodie/domain'

// Use Case 입력 DTO
export interface GetRetentionProbabilityRequest {
  studentId: string
  problemId?: string
  scheduleIds?: string[]
}

// Use Case 출력 DTO
export interface RetentionProbabilityItem {
  scheduleId: string
  problemId: string
  currentProbability: number
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced'
  daysSinceLastReview: number
  intervalDays: number
  nextReviewAt: Date
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
}

export interface GetRetentionProbabilityResponse {
  studentId: string
  calculatedAt: Date
  items: RetentionProbabilityItem[]
  summary: {
    averageProbability: number
    highRiskCount: number
    criticalRiskCount: number
    totalItems: number
  }
  recommendations: string[]
}

/**
 * 기억 보존 확률 조회 Use Case
 * 
 * 비즈니스 규칙:
 * - 에빙하우스 망각곡선을 기반으로 기억 보존 확률을 계산함
 * - 학습자의 개별 성과와 난이도를 반영함
 * - 위험도별로 분류하여 우선순위를 제공함
 * - 개별 문제 또는 전체 문제에 대한 분석 지원
 */
export class GetRetentionProbabilityUseCase {
  constructor(
    private reviewScheduleRepository: IReviewScheduleRepository,
    private clock: IClock
  ) {}

  async execute(request: GetRetentionProbabilityRequest): Promise<Result<GetRetentionProbabilityResponse>> {
    try {
      // 1. 입력 유효성 검증
      const validationResult = this.validateRequest(request)
      if (validationResult.isFailure) {
        return Result.fail<GetRetentionProbabilityResponse>(validationResult.error)
      }

      const studentId = new UniqueEntityID(request.studentId)

      // 2. 복습 스케줄 조회
      let schedules: any[] = []

      if (request.scheduleIds && request.scheduleIds.length > 0) {
        // 특정 스케줄들 조회
        const scheduleIds = request.scheduleIds.map(id => new UniqueEntityID(id))
        schedules = (await this.reviewScheduleRepository.findByIds(scheduleIds)).filter(s => s.studentId.equals(studentId))
      } else if (request.problemId) {
        // 특정 문제의 스케줄 조회
        const problemId = new UniqueEntityID(request.problemId)
        const schedule = await this.reviewScheduleRepository.findByStudentAndProblem(studentId, problemId)
        if (schedule) {
          schedules = [schedule]
        }
      } else {
        // 학생의 모든 스케줄 조회
        schedules = await this.reviewScheduleRepository.findByStudentId(studentId)
      }

      if (schedules.length === 0) {
        return Result.fail<GetRetentionProbabilityResponse>('No review schedules found')
      }

      // 3. 각 스케줄의 기억 보존 확률 계산
      const items: RetentionProbabilityItem[] = schedules.map(schedule => {
        const probability = schedule.getRetentionProbability(this.clock)
        const difficultyLevel = schedule.getDifficultyLevel()
        const daysSinceLastReview = schedule.reviewState.daysSinceLastReview(this.clock.now())
        
        return {
          scheduleId: schedule.id.toString(),
          problemId: schedule.problemId.toString(),
          currentProbability: Math.round(probability * 100) / 100,
          difficultyLevel,
          daysSinceLastReview,
          intervalDays: schedule.currentInterval,
          nextReviewAt: schedule.nextReviewAt,
          riskLevel: this.calculateRiskLevel(probability, daysSinceLastReview, schedule.currentInterval)
        }
      })

      // 4. 요약 통계 계산
      const summary = this.calculateSummary(items)

      // 5. 추천사항 생성
      const recommendations = this.generateRecommendations(items, summary)

      // 6. 응답 구성
      const response: GetRetentionProbabilityResponse = {
        studentId: request.studentId,
        calculatedAt: this.clock.now(),
        items: items.sort((a, b) => a.currentProbability - b.currentProbability), // 낮은 확률부터 정렬
        summary,
        recommendations
      }

      return Result.ok<GetRetentionProbabilityResponse>(response)

    } catch (error) {
      return Result.fail<GetRetentionProbabilityResponse>(`Failed to get retention probability: ${error}`)
    }
  }

  /**
   * 입력 요청 유효성 검증
   */
  private validateRequest(request: GetRetentionProbabilityRequest): Result<void> {
    if (!request.studentId || request.studentId.trim() === '') {
      return Result.fail<void>('Student ID is required')
    }

    if (request.scheduleIds && request.scheduleIds.some(id => !id || id.trim() === '')) {
      return Result.fail<void>('All schedule IDs must be valid')
    }

    return Result.ok<void>()
  }

  /**
   * 위험도 계산
   */
  private calculateRiskLevel(
    probability: number,
    daysSinceLastReview: number,
    intervalDays: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    // 기억 보존 확률과 복습 지연 정도를 종합 고려
    const reviewProgress = daysSinceLastReview / intervalDays

    if (probability >= 0.8 && reviewProgress <= 0.8) {
      return 'low'
    } else if (probability >= 0.6 && reviewProgress <= 1.0) {
      return 'medium'
    } else if (probability >= 0.3 || reviewProgress <= 1.5) {
      return 'high'
    } else {
      return 'critical'
    }
  }

  /**
   * 요약 통계 계산
   */
  private calculateSummary(items: RetentionProbabilityItem[]): {
    averageProbability: number
    highRiskCount: number
    criticalRiskCount: number
    totalItems: number
  } {
    const totalItems = items.length
    const averageProbability = items.reduce((sum, item) => sum + item.currentProbability, 0) / totalItems
    const highRiskCount = items.filter(item => item.riskLevel === 'high').length
    const criticalRiskCount = items.filter(item => item.riskLevel === 'critical').length

    return {
      averageProbability: Math.round(averageProbability * 100) / 100,
      highRiskCount,
      criticalRiskCount,
      totalItems
    }
  }

  /**
   * 추천사항 생성
   */
  private generateRecommendations(
    items: RetentionProbabilityItem[],
    summary: { averageProbability: number; highRiskCount: number; criticalRiskCount: number; totalItems: number }
  ): string[] {
    const recommendations: string[] = []

    // 전체 평균 기억 보존율 기반 추천
    if (summary.averageProbability < 0.5) {
      recommendations.push('전체적으로 기억 보존율이 낮습니다. 복습 빈도를 늘려보세요.')
    } else if (summary.averageProbability >= 0.8) {
      recommendations.push('우수한 기억 보존율을 유지하고 있습니다!')
    }

    // 위험도별 추천
    if (summary.criticalRiskCount > 0) {
      recommendations.push(`${summary.criticalRiskCount}개의 항목이 위험 상태입니다. 즉시 복습하세요.`)
    }

    if (summary.highRiskCount > summary.totalItems * 0.3) {
      recommendations.push('고위험 항목이 많습니다. 학습 계획을 재검토하세요.')
    }

    // 난이도별 추천
    const advancedItems = items.filter(item => item.difficultyLevel === 'advanced')
    if (advancedItems.length > 0 && advancedItems.every(item => item.currentProbability < 0.6)) {
      recommendations.push('고난도 문제들의 기억 보존율이 낮습니다. 더 자주 복습하세요.')
    }

    // 연체 항목 추천
    const overdueItems = items.filter(item => item.daysSinceLastReview > item.intervalDays)
    if (overdueItems.length > 0) {
      recommendations.push(`${overdueItems.length}개의 연체된 복습이 있습니다. 우선적으로 처리하세요.`)
    }

    // 기본 격려 메시지
    if (recommendations.length === 0) {
      recommendations.push('전반적으로 좋은 학습 상태를 유지하고 있습니다.')
    }

    return recommendations
  }
}