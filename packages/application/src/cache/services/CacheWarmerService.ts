import { ICacheService, CacheKeyBuilder, CacheStrategies } from '../../common/interfaces/ICacheService'
import { IProgressService, IProblemService } from '../../common/interfaces'
import { UniqueEntityID } from '@woodie/domain/common/Identifier'
import { Result } from '@woodie/domain/common/Result'

/**
 * 캐시 워밍 설정
 */
export interface CacheWarmingConfig {
  enabled: boolean
  scheduleHour: number // 0-23 시간
  warmingStrategies: {
    popularProblems: boolean
    topStreaks: boolean
    systemStats: boolean
    recentAggregates: boolean
  }
}

/**
 * 캐시 워밍 결과
 */
export interface CacheWarmingResult {
  totalItemsWarmed: number
  successfulWarms: number
  failedWarms: number
  executionTimeMs: number
  details: Array<{
    category: string
    items: number
    success: boolean
    error?: string
  }>
}

/**
 * 캐시 워밍 서비스
 * 시스템 성능 향상을 위해 자주 사용되는 데이터를 미리 캐시에 로드
 */
export class CacheWarmerService {
  constructor(
    private readonly cacheService: ICacheService,
    private readonly progressService: IProgressService,
    private readonly problemService: IProblemService,
    private readonly config: CacheWarmingConfig
  ) {}

  /**
   * 전체 캐시 워밍 실행
   */
  async warmCache(): Promise<Result<CacheWarmingResult>> {
    if (!this.config.enabled) {
      return Result.fail('캐시 워밍이 비활성화되어 있습니다')
    }

    const startTime = Date.now()
    const result: CacheWarmingResult = {
      totalItemsWarmed: 0,
      successfulWarms: 0,
      failedWarms: 0,
      executionTimeMs: 0,
      details: []
    }

    try {
      // 병렬로 워밍 작업 실행
      const warmingTasks: Promise<void>[] = []

      if (this.config.warmingStrategies.popularProblems) {
        warmingTasks.push(this.warmPopularProblems(result))
      }

      if (this.config.warmingStrategies.topStreaks) {
        warmingTasks.push(this.warmTopStreaks(result))
      }

      if (this.config.warmingStrategies.systemStats) {
        warmingTasks.push(this.warmSystemStats(result))
      }

      if (this.config.warmingStrategies.recentAggregates) {
        warmingTasks.push(this.warmRecentAggregates(result))
      }

      // 모든 워밍 작업 완료 대기
      await Promise.allSettled(warmingTasks)

      result.executionTimeMs = Date.now() - startTime

      return Result.ok(result)

    } catch (error) {
      result.executionTimeMs = Date.now() - startTime
      return Result.fail(`캐시 워밍 실패: ${error}`)
    }
  }

  /**
   * 인기 문제들 캐시 워밍
   */
  private async warmPopularProblems(result: CacheWarmingResult): Promise<void> {
    try {
      const limits = [10, 20, 50] // 다양한 크기의 인기 문제 목록

      for (const limit of limits) {
        try {
          await this.problemService.getPopularProblems(limit)
          result.successfulWarms++
        } catch (error) {
          result.failedWarms++
          console.error(`인기 문제 ${limit}개 워밍 실패:`, error)
        }
      }

      result.totalItemsWarmed += limits.length
      result.details.push({
        category: 'popular_problems',
        items: limits.length,
        success: true
      })

    } catch (error) {
      result.failedWarms++
      result.details.push({
        category: 'popular_problems',
        items: 0,
        success: false,
        error: String(error)
      })
    }
  }

  /**
   * 상위 스트릭들 캐시 워밍
   */
  private async warmTopStreaks(result: CacheWarmingResult): Promise<void> {
    try {
      const limits = [10, 20, 50, 100] // 다양한 크기의 순위

      for (const limit of limits) {
        try {
          await this.progressService.getTopStreaks(limit)
          result.successfulWarms++
        } catch (error) {
          result.failedWarms++
          console.error(`상위 스트릭 ${limit}개 워밍 실패:`, error)
        }
      }

      // 위험 학생 목록도 워밍
      try {
        await this.progressService.getAtRiskStudents()
        result.successfulWarms++
      } catch (error) {
        result.failedWarms++
        console.error('위험 학생 목록 워밍 실패:', error)
      }

      result.totalItemsWarmed += limits.length + 1
      result.details.push({
        category: 'top_streaks',
        items: limits.length + 1,
        success: true
      })

    } catch (error) {
      result.failedWarms++
      result.details.push({
        category: 'top_streaks',
        items: 0,
        success: false,
        error: String(error)
      })
    }
  }

  /**
   * 시스템 통계 캐시 워밍
   */
  private async warmSystemStats(result: CacheWarmingResult): Promise<void> {
    try {
      // 시스템 진도 통계 워밍
      try {
        await this.progressService.getSystemProgressStats()
        result.successfulWarms++
      } catch (error) {
        result.failedWarms++
        console.error('시스템 진도 통계 워밍 실패:', error)
      }

      result.totalItemsWarmed += 1
      result.details.push({
        category: 'system_stats',
        items: 1,
        success: true
      })

    } catch (error) {
      result.failedWarms++
      result.details.push({
        category: 'system_stats',
        items: 0,
        success: false,
        error: String(error)
      })
    }
  }

  /**
   * 최근 집계 데이터 캐시 워밍
   */
  private async warmRecentAggregates(result: CacheWarmingResult): Promise<void> {
    try {
      const today = new Date()
      const dates: string[] = []
      
      // 최근 7일간의 날짜 생성
      for (let i = 0; i < 7; i++) {
        const date = new Date(today)
        date.setDate(today.getDate() - i)
        dates.push(date.toISOString().split('T')[0])
      }

      let warmedItems = 0

      // 일별 통계 워밍
      for (const date of dates) {
        try {
          const cacheKey = CacheKeyBuilder.forTeacherStatistics(`daily_${date}`)
          const exists = await this.cacheService.exists(cacheKey)
          
          if (!exists) {
            // 집계 데이터가 없으면 생성 (실제로는 집계 테이블에서 조회)
            await this.cacheService.set(cacheKey, { date, warmed: true }, { ttl: CacheStrategies.LONG_TTL })
          }
          
          warmedItems++
          result.successfulWarms++
        } catch (error) {
          result.failedWarms++
          console.error(`일별 통계 ${date} 워밍 실패:`, error)
        }
      }

      // 주별 통계 워밍 (최근 4주)
      const weeks: string[] = []
      for (let i = 0; i < 4; i++) {
        const weekStart = this.getWeekStart(i)
        weeks.push(weekStart.toISOString().split('T')[0])
      }

      for (const weekStart of weeks) {
        try {
          const cacheKey = CacheKeyBuilder.forTeacherStatistics(`weekly_${weekStart}`)
          const exists = await this.cacheService.exists(cacheKey)
          
          if (!exists) {
            await this.cacheService.set(cacheKey, { weekStart, warmed: true }, { ttl: CacheStrategies.LONG_TTL })
          }
          
          warmedItems++
          result.successfulWarms++
        } catch (error) {
          result.failedWarms++
          console.error(`주별 통계 ${weekStart} 워밍 실패:`, error)
        }
      }

      result.totalItemsWarmed += warmedItems
      result.details.push({
        category: 'recent_aggregates',
        items: warmedItems,
        success: true
      })

    } catch (error) {
      result.failedWarms++
      result.details.push({
        category: 'recent_aggregates',
        items: 0,
        success: false,
        error: String(error)
      })
    }
  }

  /**
   * 특정 학생의 캐시 프리로딩
   */
  async warmStudentCache(studentId: UniqueEntityID): Promise<Result<void>> {
    try {
      // 병렬로 학생 관련 데이터 로드
      await Promise.allSettled([
        this.progressService.getStudentStreak(studentId),
        this.progressService.getStudentStatistics(studentId),
        // SRS 데이터는 실제 SRS 서비스에서 로드
      ])

      return Result.ok()

    } catch (error) {
      return Result.fail(`학생 캐시 워밍 실패: ${error}`)
    }
  }

  /**
   * 특정 교사의 캐시 프리로딩
   */
  async warmTeacherCache(teacherId: UniqueEntityID): Promise<Result<void>> {
    try {
      // 교사 관련 데이터 로드
      await Promise.allSettled([
        this.problemService.getProblemsByTeacher(teacherId.toString()),
        // 교사 대시보드 데이터 등
      ])

      return Result.ok()

    } catch (error) {
      return Result.fail(`교사 캐시 워밍 실패: ${error}`)
    }
  }

  /**
   * 캐시 워밍 상태 조회
   */
  async getCacheWarmingStatus(): Promise<Result<{
    lastWarmingTime?: Date
    nextScheduledWarming?: Date
    cacheHitRate: number
    warmingConfig: CacheWarmingConfig
  }>> {
    try {
      const stats = await this.cacheService.stats()
      const nextWarming = this.calculateNextWarmingTime()

      const status = {
        nextScheduledWarming: nextWarming,
        cacheHitRate: stats.hitRate,
        warmingConfig: this.config
      }

      return Result.ok(status)

    } catch (error) {
      return Result.fail(`캐시 워밍 상태 조회 실패: ${error}`)
    }
  }

  /**
   * 다음 워밍 시간 계산
   */
  private calculateNextWarmingTime(): Date {
    const now = new Date()
    const nextWarming = new Date()
    
    nextWarming.setHours(this.config.scheduleHour, 0, 0, 0)
    
    // 오늘의 워밍 시간이 이미 지났으면 내일로 설정
    if (nextWarming <= now) {
      nextWarming.setDate(nextWarming.getDate() + 1)
    }
    
    return nextWarming
  }

  /**
   * 주 시작일(월요일) 계산
   */
  private getWeekStart(weeksAgo: number = 0): Date {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    
    const monday = new Date(today)
    monday.setDate(today.getDate() + mondayOffset - (weeksAgo * 7))
    monday.setHours(0, 0, 0, 0)
    
    return monday
  }
}