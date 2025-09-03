import { ICacheService } from '@woodie/application/infrastructure/interfaces/ICacheService'
import { IPerformanceMonitor, RequestMetric, PerformanceMetrics as IPerformanceMetrics, PerformanceAlert } from '@woodie/application/infrastructure/interfaces/IPerformanceMonitor'
import { CacheKeys, CacheTTL } from '../cache/CacheService'
import { CircularBuffer } from '@woodie/application/utils/CircularBuffer'
import { AsyncLock } from '@woodie/application/utils/AsyncLock'
import { PerformanceConfigLoader, PerformanceThresholds } from '@woodie/application/config/PerformanceConfig'

/**
 * 성능 메트릭 타입
 */
export interface PerformanceMetrics {
  // 응답 시간 메트릭
  responseTime: {
    avg: number
    p50: number
    p95: number
    p99: number
  }
  
  // 처리량 메트릭
  throughput: {
    requestsPerSecond: number
    requestsPerMinute: number
  }
  
  // 에러율 메트릭
  errorRate: {
    total: number
    rate: number // 백분율
    by4xx: number
    by5xx: number
  }
  
  // 캐시 메트릭
  cache: {
    hitRate: number
    missRate: number
    totalRequests: number
  }
  
  // 데이터베이스 메트릭
  database: {
    activeConnections: number
    avgQueryTime: number
    slowQueries: number
  }
  
  // 메모리 사용량
  memory: {
    usedMB: number
    totalMB: number
    usagePercentage: number
  }
  
  // CPU 사용량
  cpu: {
    usagePercentage: number
    loadAverage: number[]
  }
  
  // 시간 정보
  timestamp: Date
  period: string // '1m', '5m', '1h' 등
}

/**
 * 레거시 호환성을 위한 타입 별칭
 */
export type AlertEvent = PerformanceAlert
export interface AlertConfig {
  responseTimeThresholdMs: number
  errorRateThreshold: number
  cacheHitRateThreshold: number
  memoryUsageThreshold: number
  cpuUsageThreshold: number
  enabled: boolean
}

/**
 * 성능 모니터링 시스템 (개선된 버전)
 * 동시성 안전성과 메모리 효율성이 적용됨
 */
export class PerformanceMonitor implements IPerformanceMonitor {
  private readonly requestBuffer: CircularBuffer<RequestMetric>
  private readonly asyncLock: AsyncLock
  private readonly startTime: Date
  private readonly thresholds: PerformanceThresholds
  private totalRequests = 0

  constructor(
    private readonly cacheService: ICacheService,
    alertConfig?: AlertConfig, // 선택적으로 유지 (레거시 호환성)
    bufferSize: number = 10000
  ) {
    this.requestBuffer = new CircularBuffer<RequestMetric>(bufferSize)
    this.asyncLock = new AsyncLock()
    this.startTime = new Date()
    this.thresholds = PerformanceConfigLoader.load().thresholds
    
    this.startPeriodicCollection()
  }

  /**
   * HTTP 요청 메트릭 기록 (스레드 안전)
   */
  public recordRequest(metric: RequestMetric): void {
    // 동시성 제어를 위한 락 사용
    this.asyncLock.acquire('record_request', async () => {
      this.requestBuffer.push(metric)
      this.totalRequests++
    }).catch(error => {
      console.error('Failed to record request metric', { error })
    })
  }

  /**
   * 레거시 호환성을 위한 메서드
   */
  public recordLegacyRequest(responseTime: number, statusCode: number): void {
    this.recordRequest({
      timestamp: new Date(),
      responseTime,
      statusCode
    })
  }

  /**
   * 성능 메트릭 조회 (인터페이스 구현)
   */
  async getMetrics(timeRangeMinutes: number = 60): Promise<IPerformanceMetrics> {
    return this.asyncLock.acquire('get_metrics', async () => {
      const cutoffTime = new Date(Date.now() - timeRangeMinutes * 60 * 1000)
      
      // 시간 범위 내의 요청들만 필터링
      const recentRequests = this.requestBuffer.filter(
        request => request.timestamp >= cutoffTime
      )

      if (recentRequests.length === 0) {
        return this.getEmptyMetrics()
      }

      // 응답 시간 계산
      const responseTimes = recentRequests.map(r => r.responseTime).sort((a, b) => a - b)
      const responseTimeMetrics = {
        avg: this.calculateAverage(responseTimes),
        min: responseTimes[0] || 0,
        max: responseTimes[responseTimes.length - 1] || 0,
        p50: this.calculatePercentile(responseTimes, 50),
        p95: this.calculatePercentile(responseTimes, 95),
        p99: this.calculatePercentile(responseTimes, 99)
      }

      // 처리량 계산
      const throughputMetrics = {
        requestsPerSecond: recentRequests.length / (timeRangeMinutes * 60),
        totalRequests: recentRequests.length
      }

      // 에러율 계산
      const errorRequests = recentRequests.filter(r => r.statusCode >= 400)
      const client4xxErrors = recentRequests.filter(r => r.statusCode >= 400 && r.statusCode < 500)
      const server5xxErrors = recentRequests.filter(r => r.statusCode >= 500)
      
      const errorRateMetrics = {
        percentage: (errorRequests.length / recentRequests.length) * 100,
        total: errorRequests.length,
        by4xx: client4xxErrors.length,
        by5xx: server5xxErrors.length
      }

      // 메모리 사용량 (Node.js process.memoryUsage() 활용)
      const memoryUsage = process.memoryUsage()
      const memoryMetrics = {
        usedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        totalMB: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
      }

      return {
        responseTime: responseTimeMetrics,
        throughput: throughputMetrics,
        errorRate: errorRateMetrics,
        memoryUsage: memoryMetrics,
        timeRange: {
          start: cutoffTime,
          end: new Date()
        }
      }
    })
  }

  /**
   * 레거시 호환성을 위한 메서드
   */
  public async getCurrentMetrics(period: string = '5m'): Promise<PerformanceMetrics> {
    const now = new Date()
    const periodMs = this.parsePeriod(period)
    const cutoffTime = new Date(now.getTime() - periodMs)
    
    // 기간 내 요청 필터링
    const recentRequests = this.requests.filter(req => req.timestamp >= cutoffTime)
    
    // 응답 시간 메트릭 계산
    const responseTimes = recentRequests.map(req => req.responseTime).sort((a, b) => a - b)
    const responseTimeMetrics = this.calculateResponseTimeMetrics(responseTimes)
    
    // 처리량 메트릭 계산
    const throughputMetrics = this.calculateThroughputMetrics(recentRequests, periodMs)
    
    // 에러율 메트릭 계산
    const errorMetrics = this.calculateErrorMetrics(recentRequests)
    
    // 캐시 메트릭 조회
    const cacheMetrics = this.cacheService.getStats()
    
    // 시스템 메트릭 조회
    const systemMetrics = await this.getSystemMetrics()
    
    const metrics: PerformanceMetrics = {
      responseTime: responseTimeMetrics,
      throughput: throughputMetrics,
      errorRate: errorMetrics,
      cache: {
        hitRate: cacheMetrics.hitRate,
        missRate: 100 - cacheMetrics.hitRate,
        totalRequests: cacheMetrics.hits + cacheMetrics.misses
      },
      database: {
        activeConnections: 0, // 실제로는 DB 풀에서 조회
        avgQueryTime: 0, // 실제로는 쿼리 로그에서 계산
        slowQueries: 0 // 실제로는 슬로우 쿼리 로그에서 계산
      },
      memory: systemMetrics.memory,
      cpu: systemMetrics.cpu,
      timestamp: now,
      period
    }
    
    // 메트릭 캐시에 저장
    await this.storeMetrics(metrics)
    
    // 알림 체크
    await this.checkAlerts(metrics)
    
    return metrics
  }

  /**
   * 과거 성능 메트릭 조회
   */
  public async getHistoricalMetrics(
    startTime: Date, 
    endTime: Date, 
    period: string = '5m'
  ): Promise<PerformanceMetrics[]> {
    const cacheKey = `metrics:historical:${startTime.toISOString()}:${endTime.toISOString()}:${period}`
    
    // 캐시에서 먼저 조회
    const cached = await this.cacheService.get<PerformanceMetrics[]>(cacheKey)
    if (cached) {
      return cached
    }
    
    // 실제로는 시계열 데이터베이스(InfluxDB, TimescaleDB 등)에서 조회
    const metrics: PerformanceMetrics[] = []
    
    // 캐시에 저장
    await this.cacheService.set(cacheKey, metrics, CacheTTL.MEDIUM)
    
    return metrics
  }

  /**
   * 성능 요약 리포트 생성
   */
  public async generatePerformanceReport(
    startTime: Date,
    endTime: Date
  ): Promise<{
    summary: {
      avgResponseTime: number
      totalRequests: number
      errorRate: number
      uptimePercentage: number
    }
    trends: {
      responseTimeTrend: 'improving' | 'degrading' | 'stable'
      errorRateTrend: 'improving' | 'degrading' | 'stable'
      throughputTrend: 'increasing' | 'decreasing' | 'stable'
    }
    alerts: AlertEvent[]
    recommendations: string[]
  }> {
    const metrics = await this.getHistoricalMetrics(startTime, endTime)
    
    if (metrics.length === 0) {
      return {
        summary: { avgResponseTime: 0, totalRequests: 0, errorRate: 0, uptimePercentage: 100 },
        trends: { responseTimeTrend: 'stable', errorRateTrend: 'stable', throughputTrend: 'stable' },
        alerts: [],
        recommendations: []
      }
    }

    // 요약 계산
    const totalRequests = metrics.reduce((sum, m) => sum + m.throughput.requestsPerMinute, 0)
    const avgResponseTime = metrics.reduce((sum, m) => sum + m.responseTime.avg, 0) / metrics.length
    const avgErrorRate = metrics.reduce((sum, m) => sum + m.errorRate.rate, 0) / metrics.length
    
    // 트렌드 분석
    const trends = this.analyzeTrends(metrics)
    
    // 최근 알림 조회
    const alerts = await this.getRecentAlerts(startTime, endTime)
    
    // 권장사항 생성
    const recommendations = this.generateRecommendations(metrics, trends)

    return {
      summary: {
        avgResponseTime,
        totalRequests,
        errorRate: avgErrorRate,
        uptimePercentage: 100 - avgErrorRate // 간단한 계산
      },
      trends,
      alerts,
      recommendations
    }
  }

  /**
   * 실시간 성능 대시보드 데이터
   */
  public async getDashboardData(): Promise<{
    current: PerformanceMetrics
    recent: PerformanceMetrics[]
    alerts: AlertEvent[]
    health: 'healthy' | 'warning' | 'critical'
  }> {
    const current = await this.getCurrentMetrics('1m')
    const recent = await this.getHistoricalMetrics(
      new Date(Date.now() - 30 * 60 * 1000), // 30분 전
      new Date(),
      '1m'
    )
    
    const alerts = await this.getRecentAlerts(
      new Date(Date.now() - 60 * 60 * 1000), // 1시간 전
      new Date()
    )
    
    // 전체 시스템 상태 계산
    const health = this.calculateSystemHealth(current, alerts)

    return { current, recent, alerts, health }
  }

  /**
   * 응답 시간 메트릭 계산
   */
  private calculateResponseTimeMetrics(responseTimes: number[]): PerformanceMetrics['responseTime'] {
    if (responseTimes.length === 0) {
      return { avg: 0, p50: 0, p95: 0, p99: 0 }
    }

    const avg = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
    const p50 = this.percentile(responseTimes, 50)
    const p95 = this.percentile(responseTimes, 95)
    const p99 = this.percentile(responseTimes, 99)

    return { avg, p50, p95, p99 }
  }

  /**
   * 처리량 메트릭 계산
   */
  private calculateThroughputMetrics(
    requests: Array<{ timestamp: Date; responseTime: number; statusCode: number }>,
    periodMs: number
  ): PerformanceMetrics['throughput'] {
    const requestCount = requests.length
    const periodSeconds = periodMs / 1000
    const requestsPerSecond = requestCount / periodSeconds
    const requestsPerMinute = requestsPerSecond * 60

    return { requestsPerSecond, requestsPerMinute }
  }

  /**
   * 에러율 메트릭 계산
   */
  private calculateErrorMetrics(
    requests: Array<{ timestamp: Date; responseTime: number; statusCode: number }>
  ): PerformanceMetrics['errorRate'] {
    const total = requests.length
    if (total === 0) {
      return { total: 0, rate: 0, by4xx: 0, by5xx: 0 }
    }

    const errors4xx = requests.filter(req => req.statusCode >= 400 && req.statusCode < 500).length
    const errors5xx = requests.filter(req => req.statusCode >= 500).length
    const totalErrors = errors4xx + errors5xx
    const rate = (totalErrors / total) * 100

    return { total: totalErrors, rate, by4xx: errors4xx, by5xx: errors5xx }
  }

  /**
   * 시스템 메트릭 조회
   */
  private async getSystemMetrics(): Promise<{
    memory: PerformanceMetrics['memory']
    cpu: PerformanceMetrics['cpu']
  }> {
    // Node.js process 정보 사용
    const memUsage = process.memoryUsage()
    const totalMB = memUsage.heapTotal / 1024 / 1024
    const usedMB = memUsage.heapUsed / 1024 / 1024
    const usagePercentage = (usedMB / totalMB) * 100

    // CPU 사용량은 실제로는 시스템 모니터링 도구에서 조회
    const cpuUsagePercentage = Math.random() * 100 // 예시
    const loadAverage = [1.0, 1.2, 1.1] // 예시

    return {
      memory: {
        usedMB: Math.round(usedMB),
        totalMB: Math.round(totalMB),
        usagePercentage: Math.round(usagePercentage)
      },
      cpu: {
        usagePercentage: Math.round(cpuUsagePercentage),
        loadAverage
      }
    }
  }

  /**
   * 백분위수 계산
   */
  private percentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0
    
    const index = (percentile / 100) * (values.length - 1)
    const lower = Math.floor(index)
    const upper = Math.ceil(index)
    
    if (lower === upper) {
      return values[lower]
    }
    
    const weight = index - lower
    return values[lower] * (1 - weight) + values[upper] * weight
  }

  /**
   * 기간 문자열을 밀리초로 변환
   */
  private parsePeriod(period: string): number {
    const match = period.match(/^(\d+)([smh])$/)
    if (!match) return 5 * 60 * 1000 // 기본값: 5분
    
    const [, value, unit] = match
    const num = parseInt(value)
    
    switch (unit) {
      case 's': return num * 1000
      case 'm': return num * 60 * 1000
      case 'h': return num * 60 * 60 * 1000
      default: return 5 * 60 * 1000
    }
  }

  /**
   * 메트릭 저장
   */
  private async storeMetrics(metrics: PerformanceMetrics): Promise<void> {
    const cacheKey = `metrics:current:${metrics.period}`
    await this.cacheService.set(cacheKey, metrics, CacheTTL.SHORT)
    
    // 시계열 데이터베이스에도 저장 (실제 구현에서)
  }

  /**
   * 알림 체크
   */
  private async checkAlerts(metrics: PerformanceMetrics): Promise<void> {
    if (!this.alertConfig.enabled) return

    const alerts: AlertEvent[] = []

    // 응답 시간 체크
    if (metrics.responseTime.avg > this.alertConfig.responseTimeThresholdMs) {
      alerts.push({
        type: 'response_time',
        severity: 'warning',
        message: `평균 응답 시간이 ${metrics.responseTime.avg}ms로 임계값을 초과했습니다`,
        value: metrics.responseTime.avg,
        threshold: this.alertConfig.responseTimeThresholdMs,
        timestamp: new Date()
      })
    }

    // 에러율 체크
    if (metrics.errorRate.rate > this.alertConfig.errorRateThreshold) {
      alerts.push({
        type: 'error_rate',
        severity: 'critical',
        message: `에러율이 ${metrics.errorRate.rate}%로 임계값을 초과했습니다`,
        value: metrics.errorRate.rate,
        threshold: this.alertConfig.errorRateThreshold,
        timestamp: new Date()
      })
    }

    // 캐시 적중률 체크
    if (metrics.cache.hitRate < this.alertConfig.cacheHitRateThreshold) {
      alerts.push({
        type: 'cache_hit_rate',
        severity: 'warning',
        message: `캐시 적중률이 ${metrics.cache.hitRate}%로 임계값 아래입니다`,
        value: metrics.cache.hitRate,
        threshold: this.alertConfig.cacheHitRateThreshold,
        timestamp: new Date()
      })
    }

    // 메모리 사용량 체크
    if (metrics.memory.usagePercentage > this.alertConfig.memoryUsageThreshold) {
      alerts.push({
        type: 'memory_usage',
        severity: 'warning',
        message: `메모리 사용량이 ${metrics.memory.usagePercentage}%로 임계값을 초과했습니다`,
        value: metrics.memory.usagePercentage,
        threshold: this.alertConfig.memoryUsageThreshold,
        timestamp: new Date()
      })
    }

    // CPU 사용량 체크
    if (metrics.cpu.usagePercentage > this.alertConfig.cpuUsageThreshold) {
      alerts.push({
        type: 'cpu_usage',
        severity: 'critical',
        message: `CPU 사용량이 ${metrics.cpu.usagePercentage}%로 임계값을 초과했습니다`,
        value: metrics.cpu.usagePercentage,
        threshold: this.alertConfig.cpuUsageThreshold,
        timestamp: new Date()
      })
    }

    // 알림 저장
    if (alerts.length > 0) {
      await this.storeAlerts(alerts)
    }
  }

  /**
   * 알림 저장
   */
  private async storeAlerts(alerts: AlertEvent[]): Promise<void> {
    const cacheKey = `alerts:recent`
    const existingAlerts = await this.cacheService.get<AlertEvent[]>(cacheKey) || []
    
    const allAlerts = [...existingAlerts, ...alerts]
    // 최근 100개만 유지
    const recentAlerts = allAlerts.slice(-100)
    
    await this.cacheService.set(cacheKey, recentAlerts, CacheTTL.LONG)
  }

  /**
   * 최근 알림 조회
   */
  private async getRecentAlerts(startTime: Date, endTime: Date): Promise<AlertEvent[]> {
    const cacheKey = `alerts:recent`
    const alerts = await this.cacheService.get<AlertEvent[]>(cacheKey) || []
    
    return alerts.filter(alert => 
      alert.timestamp >= startTime && alert.timestamp <= endTime
    )
  }

  /**
   * 트렌드 분석
   */
  private analyzeTrends(metrics: PerformanceMetrics[]): {
    responseTimeTrend: 'improving' | 'degrading' | 'stable'
    errorRateTrend: 'improving' | 'degrading' | 'stable'
    throughputTrend: 'increasing' | 'decreasing' | 'stable'
  } {
    if (metrics.length < 2) {
      return {
        responseTimeTrend: 'stable',
        errorRateTrend: 'stable',
        throughputTrend: 'stable'
      }
    }

    // 간단한 선형 회귀 또는 이동 평균을 사용한 트렌드 분석
    const half = Math.floor(metrics.length / 2)
    const firstHalf = metrics.slice(0, half)
    const secondHalf = metrics.slice(half)

    const avgResponseTimeFirst = firstHalf.reduce((sum, m) => sum + m.responseTime.avg, 0) / firstHalf.length
    const avgResponseTimeSecond = secondHalf.reduce((sum, m) => sum + m.responseTime.avg, 0) / secondHalf.length
    
    const avgErrorRateFirst = firstHalf.reduce((sum, m) => sum + m.errorRate.rate, 0) / firstHalf.length
    const avgErrorRateSecond = secondHalf.reduce((sum, m) => sum + m.errorRate.rate, 0) / secondHalf.length
    
    const avgThroughputFirst = firstHalf.reduce((sum, m) => sum + m.throughput.requestsPerSecond, 0) / firstHalf.length
    const avgThroughputSecond = secondHalf.reduce((sum, m) => sum + m.throughput.requestsPerSecond, 0) / secondHalf.length

    return {
      responseTimeTrend: avgResponseTimeSecond > avgResponseTimeFirst * 1.1 ? 'degrading' 
        : avgResponseTimeSecond < avgResponseTimeFirst * 0.9 ? 'improving' : 'stable',
      errorRateTrend: avgErrorRateSecond > avgErrorRateFirst * 1.1 ? 'degrading'
        : avgErrorRateSecond < avgErrorRateFirst * 0.9 ? 'improving' : 'stable',
      throughputTrend: avgThroughputSecond > avgThroughputFirst * 1.1 ? 'increasing'
        : avgThroughputSecond < avgThroughputFirst * 0.9 ? 'decreasing' : 'stable'
    }
  }

  /**
   * 권장사항 생성
   */
  private generateRecommendations(
    metrics: PerformanceMetrics[],
    trends: any
  ): string[] {
    const recommendations: string[] = []
    
    if (metrics.length === 0) return recommendations

    const latest = metrics[metrics.length - 1]

    // 응답 시간 권장사항
    if (latest.responseTime.avg > 1000) {
      recommendations.push('응답 시간이 1초를 초과합니다. 캐싱 전략을 검토하거나 데이터베이스 쿼리를 최적화하세요.')
    }

    // 캐시 적중률 권장사항
    if (latest.cache.hitRate < 80) {
      recommendations.push('캐시 적중률이 80% 미만입니다. 캐시 TTL 설정을 검토하고 캐시 워밍 전략을 개선하세요.')
    }

    // 에러율 권장사항
    if (latest.errorRate.rate > 5) {
      recommendations.push('에러율이 5%를 초과합니다. 로그를 확인하고 에러 처리를 개선하세요.')
    }

    // 메모리 사용량 권장사항
    if (latest.memory.usagePercentage > 80) {
      recommendations.push('메모리 사용량이 80%를 초과합니다. 메모리 누수를 확인하거나 서버 스케일링을 고려하세요.')
    }

    // 트렌드 기반 권장사항
    if (trends.responseTimeTrend === 'degrading') {
      recommendations.push('응답 시간이 악화되고 있습니다. 성능 프로파일링을 수행하세요.')
    }

    return recommendations
  }

  /**
   * 시스템 전체 상태 계산
   */
  private calculateSystemHealth(
    current: PerformanceMetrics, 
    alerts: AlertEvent[]
  ): 'healthy' | 'warning' | 'critical' {
    const criticalAlerts = alerts.filter(alert => alert.severity === 'critical').length
    const warningAlerts = alerts.filter(alert => alert.severity === 'warning').length

    if (criticalAlerts > 0 || current.errorRate.rate > 10) {
      return 'critical'
    }

    if (warningAlerts > 0 || current.responseTime.avg > 2000 || current.cache.hitRate < 70) {
      return 'warning'
    }

    return 'healthy'
  }

  /**
   * 주기적 메트릭 수집 시작
   */
  private startPeriodicCollection(): void {
    // 1분마다 메트릭 수집
    setInterval(async () => {
      try {
        await this.getCurrentMetrics('1m')
      } catch (error) {
        console.error('주기적 메트릭 수집 실패:', error)
      }
    }, 60000)
  }

  /**
   * 실시간 성능 알림 확인 (인터페이스 구현)
   */
  async checkAlerts(): Promise<PerformanceAlert[]> {
    return this.asyncLock.acquire('check_alerts', async () => {
      const alerts: PerformanceAlert[] = []
      const metrics = await this.getMetrics(5) // 최근 5분

      // 응답 시간 알림
      if (metrics.responseTime.avg > this.thresholds.responseTime.criticalMs) {
        alerts.push({
          type: 'high_response_time',
          severity: 'critical',
          message: `평균 응답 시간이 임계값을 초과했습니다 (${metrics.responseTime.avg.toFixed(2)}ms)`,
          value: metrics.responseTime.avg,
          threshold: this.thresholds.responseTime.criticalMs,
          timestamp: new Date()
        })
      } else if (metrics.responseTime.avg > this.thresholds.responseTime.warningMs) {
        alerts.push({
          type: 'high_response_time',
          severity: 'high',
          message: `평균 응답 시간이 경고 수준입니다 (${metrics.responseTime.avg.toFixed(2)}ms)`,
          value: metrics.responseTime.avg,
          threshold: this.thresholds.responseTime.warningMs,
          timestamp: new Date()
        })
      }

      // 에러율 알림
      if (metrics.errorRate.percentage > this.thresholds.errorRate.criticalPercent) {
        alerts.push({
          type: 'high_error_rate',
          severity: 'critical',
          message: `에러율이 임계값을 초과했습니다 (${metrics.errorRate.percentage.toFixed(1)}%)`,
          value: metrics.errorRate.percentage,
          threshold: this.thresholds.errorRate.criticalPercent,
          timestamp: new Date()
        })
      }

      // 메모리 사용량 알림
      if (metrics.memoryUsage.percentage > this.thresholds.memoryUsage.criticalPercent) {
        alerts.push({
          type: 'high_memory_usage',
          severity: 'critical',
          message: `메모리 사용률이 임계값을 초과했습니다 (${metrics.memoryUsage.percentage.toFixed(1)}%)`,
          value: metrics.memoryUsage.percentage,
          threshold: this.thresholds.memoryUsage.criticalPercent,
          timestamp: new Date()
        })
      }

      return alerts
    })
  }

  /**
   * 메트릭 데이터 정리 (인터페이스 구현)
   */
  async cleanup(olderThanHours: number = 24): Promise<number> {
    return this.asyncLock.acquire('cleanup', async () => {
      const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000)
      
      let removedCount = 0
      const requests = this.requestBuffer.toArray()
      
      // 새로운 버퍼로 최신 데이터만 유지
      this.requestBuffer.clear()
      
      for (const request of requests) {
        if (request.timestamp >= cutoffTime) {
          this.requestBuffer.push(request)
        } else {
          removedCount++
        }
      }

      return removedCount
    })
  }

  /**
   * 모니터링 상태 확인 (인터페이스 구현)
   */
  getStatus(): {
    isRunning: boolean
    startTime: Date
    totalRecords: number
  } {
    return {
      isRunning: true,
      startTime: this.startTime,
      totalRecords: this.totalRequests
    }
  }

  /**
   * 평균값 계산
   */
  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length
  }

  /**
   * 백분위수 계산
   */
  private calculatePercentile(sortedNumbers: number[], percentile: number): number {
    if (sortedNumbers.length === 0) return 0
    
    const index = Math.ceil((percentile / 100) * sortedNumbers.length) - 1
    return sortedNumbers[Math.max(0, index)]
  }

  /**
   * 빈 메트릭 반환
   */
  private getEmptyMetrics(): IPerformanceMetrics {
    return {
      responseTime: { avg: 0, min: 0, max: 0, p50: 0, p95: 0, p99: 0 },
      throughput: { requestsPerSecond: 0, totalRequests: 0 },
      errorRate: { percentage: 0, total: 0, by4xx: 0, by5xx: 0 },
      memoryUsage: { usedMB: 0, totalMB: 0, percentage: 0 },
      timeRange: { start: new Date(), end: new Date() }
    }
  }
}