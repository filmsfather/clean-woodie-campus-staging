import { BaseUseCase } from '../../use-cases/UseCase'
import { Result, IProblemSetRepository } from '@woodie/domain'

/**
 * 문제집 통계 조회 UseCase
 * 
 * 비즈니스 규칙:
 * - 교사는 자신의 문제집 통계를 조회할 수 있음
 * - 관리자는 모든 문제집 통계를 조회할 수 있음
 * - 학생은 접근 권한이 없음
 * - 통계에는 사용 현황, 성능 지표, 문제별 분석 포함
 * - 기간별 필터링 지원
 */

export interface GetProblemSetStatisticsRequest {
  problemSetId: string
  requesterId: string
  requesterRole: 'teacher' | 'admin'
  dateRange?: {
    startDate: Date
    endDate: Date
  }
  includeDetailedAnalysis?: boolean
  includeProblemBreakdown?: boolean
}

export interface GetProblemSetStatisticsResponse {
  problemSet: {
    id: string
    title: string
    teacherId: string
    teacherName?: string
    itemCount: number
    totalPoints: number
    createdAt: Date
    lastModified: Date
  }
  usageStatistics: {
    totalAssignments: number
    activeAssignments: number
    completedAssignments: number
    totalStudentsAssigned: number
    uniqueStudentsAttempted: number
    totalAttempts: number
    completionRate: number // 완료율 (%)
    averageScore: number
    averageTimeSpent: number // 분 단위
  }
  performanceMetrics: {
    difficultyRating: number // 1-5 스케일
    studentFeedbackScore: number
    teacherRating: number
    retryRate: number // 재시도율
    dropoutRate: number // 중도 포기율
    timeEfficiency: number // 예상 시간 대비 실제 시간
  }
  problemAnalysis?: Array<{
    problemId: string
    problemTitle: string
    orderIndex: number
    attempts: number
    correctAttempts: number
    accuracyRate: number
    averageTimeSpent: number
    difficultyPerception: 'easy' | 'medium' | 'hard'
    commonMistakes: string[]
    skipRate: number
  }>
  trendData: {
    dailyUsage: Array<{
      date: string
      attempts: number
      completions: number
      averageScore: number
    }>
    monthlyProgress: Array<{
      month: string
      totalStudents: number
      completionRate: number
      averageScore: number
    }>
  }
  comparativeAnalysis?: {
    similarProblemSets: Array<{
      id: string
      title: string
      completionRate: number
      averageScore: number
      difficulty: number
    }>
    teacherAverage: {
      completionRate: number
      averageScore: number
      studentSatisfaction: number
    }
    schoolAverage?: {
      completionRate: number
      averageScore: number
      studentSatisfaction: number
    }
  }
  recommendations: Array<{
    type: 'difficulty' | 'content' | 'structure' | 'timing'
    priority: 'high' | 'medium' | 'low'
    message: string
    actionSuggestion?: string
  }>
}

export class GetProblemSetStatisticsUseCase extends BaseUseCase<GetProblemSetStatisticsRequest, GetProblemSetStatisticsResponse> {
  constructor(
    private problemSetRepository: IProblemSetRepository
    // 실제로는 StatisticsRepository, AssignmentRepository 등도 필요
  ) {
    super()
  }

  async execute(request: GetProblemSetStatisticsRequest): Promise<Result<GetProblemSetStatisticsResponse>> {
    try {
      // 1. 입력 유효성 검증
      const validationResult = this.validateRequest(request)
      if (validationResult.isFailure) {
        return Result.fail<GetProblemSetStatisticsResponse>(validationResult.error)
      }

      // 2. 문제집 조회
      const problemSetResult = await this.problemSetRepository.findById(request.problemSetId)
      if (problemSetResult.isFailure) {
        return Result.fail<GetProblemSetStatisticsResponse>('Problem set not found')
      }

      const problemSet = problemSetResult.value

      // 3. 접근 권한 확인
      if (!this.hasAccessPermission(problemSet, request.requesterId, request.requesterRole)) {
        return Result.fail<GetProblemSetStatisticsResponse>('Insufficient permissions to view statistics')
      }

      // 4. 기본 사용 통계 수집
      const usageStatistics = await this.collectUsageStatistics(
        request.problemSetId, 
        request.dateRange
      )

      // 5. 성능 지표 계산
      const performanceMetrics = await this.calculatePerformanceMetrics(
        request.problemSetId,
        request.dateRange
      )

      // 6. 상세 문제 분석 (요청된 경우)
      let problemAnalysis: any[] | undefined
      if (request.includeProblemBreakdown) {
        problemAnalysis = await this.analyzeProblemPerformance(
          request.problemSetId,
          request.dateRange
        )
      }

      // 7. 트렌드 데이터 생성
      const trendData = await this.generateTrendData(
        request.problemSetId,
        request.dateRange
      )

      // 8. 비교 분석 (요청된 경우)
      let comparativeAnalysis: any | undefined
      if (request.includeDetailedAnalysis) {
        comparativeAnalysis = await this.performComparativeAnalysis(
          problemSet,
          request.dateRange
        )
      }

      // 9. 개선 권장사항 생성
      const recommendations = this.generateRecommendations(
        usageStatistics,
        performanceMetrics,
        problemAnalysis
      )

      // 10. 응답 생성
      const response: GetProblemSetStatisticsResponse = {
        problemSet: {
          id: problemSet.id.toString(),
          title: problemSet.title.value,
          teacherId: problemSet.teacherId,
          teacherName: 'Teacher Name', // 실제로는 Teacher 서비스에서 조회
          itemCount: problemSet.itemCount,
          totalPoints: this.calculateTotalPoints(problemSet),
          createdAt: problemSet.createdAt,
          lastModified: problemSet.updatedAt
        },
        usageStatistics,
        performanceMetrics,
        problemAnalysis,
        trendData,
        comparativeAnalysis,
        recommendations
      }

      return Result.ok<GetProblemSetStatisticsResponse>(response)

    } catch (error) {
      return Result.fail<GetProblemSetStatisticsResponse>(`Unexpected error retrieving statistics: ${error}`)
    }
  }

  private validateRequest(request: GetProblemSetStatisticsRequest): Result<void> {
    const errors: string[] = []

    if (!request.problemSetId || request.problemSetId.trim().length === 0) {
      errors.push('Problem set ID is required')
    }

    if (!request.requesterId || request.requesterId.trim().length === 0) {
      errors.push('Requester ID is required')
    }

    if (!['teacher', 'admin'].includes(request.requesterRole)) {
      errors.push('Invalid requester role. Only teachers and admins can view statistics')
    }

    if (request.dateRange) {
      if (request.dateRange.startDate > request.dateRange.endDate) {
        errors.push('Start date cannot be after end date')
      }

      const now = new Date()
      if (request.dateRange.endDate > now) {
        errors.push('End date cannot be in the future')
      }
    }

    if (errors.length > 0) {
      return Result.fail<void>(errors.join(', '))
    }

    return Result.ok<void>()
  }

  private hasAccessPermission(problemSet: any, requesterId: string, requesterRole: string): boolean {
    if (requesterRole === 'admin') {
      return true
    }

    if (requesterRole === 'teacher' && problemSet.teacherId === requesterId) {
      return true
    }

    return false
  }

  private async collectUsageStatistics(problemSetId: string, dateRange?: any): Promise<any> {
    // 실제로는 Assignment, StudentProgress, StudyRecord 등에서 데이터 수집
    return {
      totalAssignments: 15,
      activeAssignments: 8,
      completedAssignments: 7,
      totalStudentsAssigned: 120,
      uniqueStudentsAttempted: 95,
      totalAttempts: 450,
      completionRate: 79.2,
      averageScore: 82.5,
      averageTimeSpent: 25.3
    }
  }

  private async calculatePerformanceMetrics(problemSetId: string, dateRange?: any): Promise<any> {
    // 실제로는 복잡한 통계 계산 로직
    return {
      difficultyRating: 3.2,
      studentFeedbackScore: 4.1,
      teacherRating: 4.3,
      retryRate: 15.8,
      dropoutRate: 8.3,
      timeEfficiency: 0.95
    }
  }

  private async analyzeProblemPerformance(problemSetId: string, dateRange?: any): Promise<any[]> {
    // 실제로는 각 문제별 상세 통계 분석
    return [
      {
        problemId: 'prob_1',
        problemTitle: 'Basic Algebra',
        orderIndex: 1,
        attempts: 95,
        correctAttempts: 78,
        accuracyRate: 82.1,
        averageTimeSpent: 3.5,
        difficultyPerception: 'medium' as const,
        commonMistakes: ['Sign error', 'Calculation mistake'],
        skipRate: 2.1
      }
    ]
  }

  private async generateTrendData(problemSetId: string, dateRange?: any): Promise<any> {
    // 실제로는 시계열 데이터 분석
    return {
      dailyUsage: [
        {
          date: '2024-01-01',
          attempts: 15,
          completions: 12,
          averageScore: 85.2
        }
      ],
      monthlyProgress: [
        {
          month: '2024-01',
          totalStudents: 30,
          completionRate: 85.5,
          averageScore: 82.1
        }
      ]
    }
  }

  private async performComparativeAnalysis(problemSet: any, dateRange?: any): Promise<any> {
    // 실제로는 유사한 문제집들과 비교 분석
    return {
      similarProblemSets: [
        {
          id: 'similar_1',
          title: 'Similar Problem Set',
          completionRate: 75.3,
          averageScore: 79.2,
          difficulty: 3.1
        }
      ],
      teacherAverage: {
        completionRate: 77.8,
        averageScore: 80.5,
        studentSatisfaction: 4.0
      },
      schoolAverage: {
        completionRate: 74.2,
        averageScore: 78.9,
        studentSatisfaction: 3.9
      }
    }
  }

  private generateRecommendations(
    usageStats: any,
    performanceMetrics: any,
    problemAnalysis?: any[]
  ): any[] {
    const recommendations: any[] = []

    // 완료율이 낮은 경우
    if (usageStats.completionRate < 70) {
      recommendations.push({
        type: 'difficulty',
        priority: 'high',
        message: 'Low completion rate detected. Consider reviewing problem difficulty.',
        actionSuggestion: 'Review problems with high dropout rates and consider providing additional hints or examples.'
      })
    }

    // 평균 점수가 낮은 경우
    if (usageStats.averageScore < 70) {
      recommendations.push({
        type: 'content',
        priority: 'high',
        message: 'Low average scores suggest content may be too challenging.',
        actionSuggestion: 'Add prerequisite problems or provide more detailed explanations.'
      })
    }

    // 재시도율이 높은 경우
    if (performanceMetrics.retryRate > 20) {
      recommendations.push({
        type: 'structure',
        priority: 'medium',
        message: 'High retry rate indicates problems may need clearer instructions.',
        actionSuggestion: 'Review problem statements for clarity and add step-by-step guidance.'
      })
    }

    // 시간 효율성이 낮은 경우
    if (performanceMetrics.timeEfficiency < 0.8) {
      recommendations.push({
        type: 'timing',
        priority: 'low',
        message: 'Students are taking longer than expected to complete problems.',
        actionSuggestion: 'Consider breaking down complex problems into smaller steps.'
      })
    }

    return recommendations
  }

  private calculateTotalPoints(problemSet: any): number {
    const items = problemSet.getOrderedItems()
    return items.reduce((total: number, item: any) => total + (item.points || 10), 0)
  }
}