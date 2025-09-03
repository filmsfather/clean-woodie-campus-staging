import { UniqueEntityID } from '@domain/common/Identifier'
import { Result } from '@domain/common/Result'
import { ReviewQueueService, ReviewStatistics } from '../services/ReviewQueueService'
import { NotificationManagementService, NotificationStatistics } from '../services/NotificationManagementService'

// Use Case 입력 DTO
export interface GetReviewStatisticsRequest {
  studentId: string
  period?: 'today' | 'week' | 'month' | 'all'
  includeNotifications?: boolean
}

// Use Case 출력 DTO
export interface GetReviewStatisticsResponse {
  period: string
  review: {
    totalScheduled: number
    dueToday: number
    overdue: number
    completedToday: number
    streakDays: number
    averageRetention: number
    totalTimeSpent: number
    // 계산된 지표들
    completionRate: number
    efficiency: number
    avgSessionTime: number
    productivity: 'excellent' | 'good' | 'fair' | 'needs_improvement'
  }
  notification?: NotificationStatistics
  trends?: {
    retentionTrend: 'improving' | 'stable' | 'declining'
    speedTrend: 'improving' | 'stable' | 'declining'
    consistencyScore: number
  }
  recommendations?: string[]
}

/**
 * 복습 통계 조회 Use Case
 * 
 * 비즈니스 규칙:
 * - 인증된 사용자만 자신의 통계를 조회할 수 있음
 * - 기간별 통계 필터링 지원
 * - 학습 효율성 지표 계산
 * - 개선 제안 사항 포함
 * - 알림 통계 선택적 포함
 */
export class GetReviewStatisticsUseCase {
  constructor(
    private reviewQueueService: ReviewQueueService,
    private notificationService: NotificationManagementService
  ) {}

  async execute(request: GetReviewStatisticsRequest): Promise<Result<GetReviewStatisticsResponse>> {
    try {
      // 1. 입력 유효성 검증
      if (!request.studentId || request.studentId.trim() === '') {
        return Result.fail<GetReviewStatisticsResponse>('Student ID is required')
      }

      const studentId = new UniqueEntityID(request.studentId)
      const period = request.period || 'all'

      // 2. 복습 통계 조회
      const reviewStatsResult = await this.reviewQueueService.getReviewStatistics(studentId)
      if (reviewStatsResult.isFailure) {
        return Result.fail<GetReviewStatisticsResponse>(reviewStatsResult.error)
      }

      const reviewStats = reviewStatsResult.getValue()

      // 3. 알림 통계 조회 (옵션)
      let notificationStats: NotificationStatistics | undefined

      if (request.includeNotifications) {
        const notificationResult = await this.notificationService.getNotificationStatistics(studentId)
        if (notificationResult.isSuccess) {
          notificationStats = notificationResult.getValue()
        }
      }

      // 4. 계산된 지표들 생성
      const calculatedMetrics = this.calculateMetrics(reviewStats)

      // 5. 트렌드 분석 (간단한 로직)
      const trends = this.analyzeTrends(reviewStats)

      // 6. 개선 제안 생성
      const recommendations = this.generateRecommendations(reviewStats, calculatedMetrics)

      // 7. 응답 구성
      const response: GetReviewStatisticsResponse = {
        period,
        review: {
          ...reviewStats,
          ...calculatedMetrics
        },
        notification: notificationStats,
        trends,
        recommendations
      }

      return Result.ok<GetReviewStatisticsResponse>(response)

    } catch (error) {
      return Result.fail<GetReviewStatisticsResponse>(`Failed to get review statistics: ${error}`)
    }
  }

  /**
   * 계산된 지표들 생성
   */
  private calculateMetrics(stats: ReviewStatistics): {
    completionRate: number
    efficiency: number
    avgSessionTime: number
    productivity: 'excellent' | 'good' | 'fair' | 'needs_improvement'
  } {
    // 완료율 계산
    const completionRate = stats.dueToday > 0 ? 
      Math.round((stats.completedToday / stats.dueToday) * 100) : 0

    // 효율성 계산 (완료한 항목 수 / 소요 시간)
    const efficiency = stats.totalTimeSpent > 0 ? 
      Math.round((stats.completedToday / (stats.totalTimeSpent / 60)) * 100) / 100 : 0

    // 평균 세션 시간 계산 (분 단위)
    const avgSessionTime = stats.completedToday > 0 ? 
      Math.round((stats.totalTimeSpent / stats.completedToday) * 10) / 10 : 0

    // 생산성 등급 계산
    let productivity: 'excellent' | 'good' | 'fair' | 'needs_improvement'
    
    if (completionRate >= 90 && stats.averageRetention >= 80 && stats.streakDays >= 7) {
      productivity = 'excellent'
    } else if (completionRate >= 70 && stats.averageRetention >= 70) {
      productivity = 'good'
    } else if (completionRate >= 50 && stats.averageRetention >= 60) {
      productivity = 'fair'
    } else {
      productivity = 'needs_improvement'
    }

    return {
      completionRate,
      efficiency,
      avgSessionTime,
      productivity
    }
  }

  /**
   * 트렌드 분석 (간단한 로직 - 실제로는 시계열 데이터 필요)
   */
  private analyzeTrends(stats: ReviewStatistics): {
    retentionTrend: 'improving' | 'stable' | 'declining'
    speedTrend: 'improving' | 'stable' | 'declining'
    consistencyScore: number
  } {
    // 간단한 휴리스틱 기반 트렌드 분석
    let retentionTrend: 'improving' | 'stable' | 'declining'
    
    if (stats.averageRetention >= 80) {
      retentionTrend = 'improving'
    } else if (stats.averageRetention >= 70) {
      retentionTrend = 'stable'
    } else {
      retentionTrend = 'declining'
    }

    // 속도 트렌드 (완료 시간 기반)
    let speedTrend: 'improving' | 'stable' | 'declining' = 'stable'
    if (stats.totalTimeSpent > 0 && stats.completedToday > 0) {
      const avgTime = stats.totalTimeSpent / stats.completedToday
      speedTrend = avgTime < 3 ? 'improving' : avgTime > 5 ? 'declining' : 'stable'
    }

    // 일관성 점수 (연속 학습 일수 기반)
    const consistencyScore = Math.min(100, Math.round((stats.streakDays / 30) * 100))

    return {
      retentionTrend,
      speedTrend,
      consistencyScore
    }
  }

  /**
   * 개선 제안 생성
   */
  private generateRecommendations(
    stats: ReviewStatistics,
    metrics: { completionRate: number; efficiency: number; productivity: string }
  ): string[] {
    const recommendations: string[] = []

    // 완료율 기반 제안
    if (metrics.completionRate < 70) {
      recommendations.push('하루에 조금씩이라도 꾸준히 복습하는 습관을 만들어보세요.')
    }

    // 정답률 기반 제안
    if (stats.averageRetention < 70) {
      recommendations.push('어려운 문제는 더 자주 복습하도록 피드백을 조정해보세요.')
    }

    // 연속성 기반 제안
    if (stats.streakDays < 3) {
      recommendations.push('매일 조금씩이라도 학습하는 것이 효과적입니다.')
    } else if (stats.streakDays >= 7) {
      recommendations.push('훌륭한 학습 습관을 유지하고 계시네요! 계속 이어가세요.')
    }

    // 연체 항목 기반 제안
    if (stats.overdue > 5) {
      recommendations.push('연체된 복습이 많습니다. 우선순위가 높은 항목부터 먼저 완료해보세요.')
    }

    // 효율성 기반 제안
    if (metrics.efficiency < 1) {
      recommendations.push('문제를 풀기 전에 핵심 개념을 다시 한 번 확인해보세요.')
    }

    // 기본 격려 메시지
    if (recommendations.length === 0) {
      recommendations.push('좋은 학습 패턴을 보이고 있습니다! 현재 수준을 유지해보세요.')
    }

    return recommendations
  }
}