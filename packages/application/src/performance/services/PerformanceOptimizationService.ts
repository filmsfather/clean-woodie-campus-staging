import { ICacheService } from '../../infrastructure/interfaces/ICacheService'
import { IPerformanceMonitor } from '../../infrastructure/interfaces/IPerformanceMonitor'
import { IAssetManager } from '../../infrastructure/interfaces/IAssetManager'
import { Result } from '@woodie/domain/common/Result'
import { PerformanceConfigLoader, PerformanceThresholds, RateLimitSettings } from '../../config/PerformanceConfig'
import { AsyncLock } from '../../utils/AsyncLock'
import { ConcurrencyLimiter, TokenBucketRateLimiter } from '../../utils/RateLimiter'

/**
 * 성능 최적화 추천사항
 */
export interface PerformanceRecommendation {
  type: 'cache' | 'database' | 'cdn' | 'memory' | 'concurrency'
  priority: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  impact: string
  implementation: string
  estimatedImprovement: string
}

/**
 * 최적화 실행 결과
 */
export interface OptimizationResult {
  executed: string[]
  skipped: string[]
  failed: string[]
  improvements: {
    responseTimeReduction?: number
    memoryReduction?: number
    cacheHitRateIncrease?: number
  }
  executionTimeMs: number
}

/**
 * 성능 최적화 서비스 (개선된 버전)
 * 의존성 역전, 동시성 안전성, 레이트 리밋이 적용된 아키텍처
 */
export class PerformanceOptimizationService {
  private readonly asyncLock: AsyncLock
  private readonly concurrencyLimiter: ConcurrencyLimiter
  private readonly rateLimiter: TokenBucketRateLimiter
  private readonly thresholds: PerformanceThresholds
  private readonly rateLimit: RateLimitSettings

  constructor(
    private readonly cacheService: ICacheService,
    private readonly performanceMonitor: IPerformanceMonitor,
    private readonly assetManager: IAssetManager
  ) {
    const config = PerformanceConfigLoader.load()
    this.thresholds = config.thresholds
    this.rateLimit = config.rateLimit

    // 동시성 제어 도구들 초기화
    this.asyncLock = new AsyncLock()
    this.concurrencyLimiter = new ConcurrencyLimiter(this.rateLimit.optimization.maxConcurrentJobs)
    this.rateLimiter = new TokenBucketRateLimiter(
      this.rateLimit.optimization.maxConcurrentJobs,
      1 / (this.rateLimit.optimization.cooldownMinutes * 60) // 쿨다운 기간을 고려한 rate
    )
  }

  /**
   * 성능 분석 및 최적화 추천사항 생성
   */
  async analyzePerformance(): Promise<Result<PerformanceRecommendation[]>> {
    return this.asyncLock.acquire('performance_analysis', async () => {
      try {
        const recommendations: PerformanceRecommendation[] = []

        // 1. 성능 메트릭 수집
        const metricsResult = await this.performanceMonitor.getMetrics(60) // 최근 1시간
        const cacheStats = this.cacheService.getStats()
        const assetStats = await this.assetManager.getUsageStats('day')

        // 2. 응답 시간 분석
        if (metricsResult.responseTime.avg > this.thresholds.responseTime.warningMs) {
          recommendations.push({
            type: 'cache',
            priority: metricsResult.responseTime.avg > this.thresholds.responseTime.criticalMs ? 'critical' : 'high',
            title: '응답 시간 최적화 필요',
            description: `평균 응답 시간이 ${metricsResult.responseTime.avg.toFixed(2)}ms로 임계값(${this.thresholds.responseTime.warningMs}ms)을 초과했습니다.`,
            impact: '사용자 경험 저하, 이탈률 증가',
            implementation: '자주 조회되는 데이터에 대한 캐싱 전략 강화, 데이터베이스 쿼리 최적화',
            estimatedImprovement: '30-50% 응답 시간 단축 예상'
          })
        }

        // 3. 캐시 성능 분석
        if (cacheStats.hitRate < this.thresholds.cache.minHitRatePercent) {
          recommendations.push({
            type: 'cache',
            priority: cacheStats.hitRate < this.thresholds.cache.minHitRatePercent * 0.7 ? 'high' : 'medium',
            title: '캐시 히트율 개선 필요',
            description: `캐시 히트율이 ${cacheStats.hitRate.toFixed(1)}%로 목표치(${this.thresholds.cache.minHitRatePercent}%)보다 낮습니다.`,
            impact: '데이터베이스 부하 증가, 응답 시간 지연',
            implementation: '캐시 키 전략 재검토, TTL 조정, 캐시 워밍 강화',
            estimatedImprovement: '20-30% 데이터베이스 부하 감소 예상'
          })
        }

        // 4. 에러율 분석
        if (metricsResult.errorRate.percentage > this.thresholds.errorRate.warningPercent) {
          recommendations.push({
            type: 'database',
            priority: metricsResult.errorRate.percentage > this.thresholds.errorRate.criticalPercent ? 'critical' : 'high',
            title: '에러율 임계값 초과',
            description: `에러율이 ${metricsResult.errorRate.percentage.toFixed(1)}%로 임계값을 초과했습니다.`,
            impact: '시스템 안정성 저하, 사용자 신뢰도 하락',
            implementation: '에러 로그 분석, 데이터베이스 연결 풀 최적화, 서킷 브레이커 패턴 적용',
            estimatedImprovement: '에러율 50% 이상 감소 예상'
          })
        }

        // 5. 메모리 사용량 분석
        if (metricsResult.memoryUsage.percentage > this.thresholds.memoryUsage.warningPercent) {
          recommendations.push({
            type: 'memory',
            priority: metricsResult.memoryUsage.percentage > this.thresholds.memoryUsage.criticalPercent ? 'critical' : 'high',
            title: '메모리 사용량 최적화 필요',
            description: `메모리 사용률이 ${metricsResult.memoryUsage.percentage.toFixed(1)}%로 높습니다.`,
            impact: 'GC 빈발, 성능 저하, OOM 위험',
            implementation: '메모리 누수 점검, 객체 풀링, 순환 버퍼 활용',
            estimatedImprovement: '20-30% 메모리 사용량 감소 예상'
          })
        }

        // 6. CDN/자산 최적화 분석
        const totalAssetSize = assetStats.totalSize / (1024 * 1024) // MB
        if (totalAssetSize > 1000) { // 1GB 이상
          recommendations.push({
            type: 'cdn',
            priority: totalAssetSize > 2000 ? 'high' : 'medium',
            title: 'CDN 자산 최적화 필요',
            description: `정적 자산 총 크기가 ${totalAssetSize.toFixed(2)}MB로 큽니다.`,
            impact: '로딩 시간 증가, 대역폭 비용 상승',
            implementation: '이미지 최적화, 사용하지 않는 자산 정리, 압축 강화',
            estimatedImprovement: '30-40% 로딩 시간 단축 예상'
          })
        }

        return Result.ok(recommendations.sort((a, b) => {
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
          return priorityOrder[b.priority] - priorityOrder[a.priority]
        }))

      } catch (error) {
        return Result.fail(`성능 분석 실패: ${error}`)
      }
    })
  }

  /**
   * 자동 최적화 실행 (레이트 리밋 적용)
   */
  async executeOptimizations(
    recommendations: PerformanceRecommendation[]
  ): Promise<Result<OptimizationResult>> {
    // 레이트 리밋 확인
    const rateLimitResult = this.rateLimiter.consume(1)
    if (!rateLimitResult.allowed) {
      return Result.fail(
        `최적화 실행이 일시적으로 제한되었습니다. ${rateLimitResult.retryAfter}초 후 다시 시도해주세요.`
      )
    }

    return this.concurrencyLimiter.execute(async () => {
      return this.asyncLock.acquire('optimization_execution', async () => {
        const startTime = Date.now()
        const result: OptimizationResult = {
          executed: [],
          skipped: [],
          failed: [],
          improvements: {},
          executionTimeMs: 0
        }

        try {
          // 성능 측정을 위한 기준값 수집
          const beforeMetrics = await this.performanceMonitor.getMetrics(5)
          const beforeCacheStats = this.cacheService.getStats()

          // 우선순위 높은 최적화부터 실행
          const criticalRecommendations = recommendations
            .filter(r => r.priority === 'critical' || r.priority === 'high')
            .slice(0, 5) // 한 번에 최대 5개만 처리

          for (const recommendation of criticalRecommendations) {
            try {
              await this.executeOptimization(recommendation)
              result.executed.push(recommendation.title)
            } catch (error) {
              result.failed.push(`${recommendation.title}: ${error}`)
            }
          }

          // 최적화 후 성능 개선 측정 (30초 대기 후)
          await new Promise(resolve => setTimeout(resolve, 30000))
          
          const afterMetrics = await this.performanceMonitor.getMetrics(5)
          const afterCacheStats = this.cacheService.getStats()

          // 개선사항 계산
          if (beforeMetrics.responseTime.avg > afterMetrics.responseTime.avg) {
            result.improvements.responseTimeReduction = 
              ((beforeMetrics.responseTime.avg - afterMetrics.responseTime.avg) / beforeMetrics.responseTime.avg) * 100
          }

          if (beforeCacheStats.hitRate < afterCacheStats.hitRate) {
            result.improvements.cacheHitRateIncrease = 
              afterCacheStats.hitRate - beforeCacheStats.hitRate
          }

          if (beforeMetrics.memoryUsage.usedMB > afterMetrics.memoryUsage.usedMB) {
            result.improvements.memoryReduction = 
              ((beforeMetrics.memoryUsage.usedMB - afterMetrics.memoryUsage.usedMB) / beforeMetrics.memoryUsage.usedMB) * 100
          }

          result.executionTimeMs = Date.now() - startTime

          return Result.ok(result)

        } catch (error) {
          result.executionTimeMs = Date.now() - startTime
          return Result.fail(`최적화 실행 실패: ${error}`)
        }
      })
    })
  }

  /**
   * 개별 최적화 실행
   */
  private async executeOptimization(recommendation: PerformanceRecommendation): Promise<void> {
    switch (recommendation.type) {
      case 'cache':
        await this.optimizeCache()
        break
      case 'memory':
        await this.optimizeMemory()
        break
      case 'cdn':
        await this.optimizeCDN()
        break
      case 'database':
        await this.optimizeDatabase()
        break
      default:
        throw new Error(`알 수 없는 최적화 타입: ${recommendation.type}`)
    }
  }

  /**
   * 캐시 최적화
   */
  private async optimizeCache(): Promise<void> {
    // 효율성이 낮은 캐시 패턴 정리
    const patterns = ['temp:*', 'session:expired:*', 'stats:old:*']
    
    for (const pattern of patterns) {
      try {
        await this.cacheService.invalidatePattern(pattern)
      } catch (error) {
        // 개별 패턴 실패는 무시하고 계속 진행
        console.warn(`캐시 패턴 ${pattern} 정리 실패:`, error)
      }
    }
  }

  /**
   * 메모리 최적화
   */
  private async optimizeMemory(): Promise<void> {
    // 강제 가비지 컬렉션 (Node.js 환경)
    if (global.gc) {
      global.gc()
    }

    // 성능 모니터링 데이터 정리 (24시간 이상 된 데이터)
    await this.performanceMonitor.cleanup(24)
  }

  /**
   * CDN 최적화
   */
  private async optimizeCDN(): Promise<void> {
    // 사용하지 않는 자산 정리 (90일 이상)
    await this.assetManager.cleanupUnusedAssets(90)
  }

  /**
   * 데이터베이스 최적화 (모의 구현)
   */
  private async optimizeDatabase(): Promise<void> {
    // 실제로는 데이터베이스 커넥션 풀 최적화, 느린 쿼리 분석 등을 수행
    console.log('데이터베이스 최적화 실행됨')
  }

  /**
   * 최적화 서비스 상태 조회
   */
  getOptimizationStatus(): {
    isRunning: boolean
    activeJobs: number
    queueLength: number
    rateLimitStatus: {
      tokensRemaining: number
      timeUntilReset: number
    }
  } {
    return {
      isRunning: this.concurrencyLimiter.getRunningCount() > 0,
      activeJobs: this.concurrencyLimiter.getRunningCount(),
      queueLength: this.concurrencyLimiter.getQueueLength(),
      rateLimitStatus: {
        tokensRemaining: this.rateLimiter.getAvailableTokens(),
        timeUntilReset: this.rateLimiter.getTimeUntilNextToken()
      }
    }
  }
}