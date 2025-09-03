/**
 * Infrastructure Layer - Performance Monitor Implementation
 * DDD/Clean Architecture 원칙에 따른 성능 모니터링 구현체
 */

import { CacheKeys, CacheTTL } from '../cache/CacheService'
import { ICacheService } from '@woodie/application/infrastructure/interfaces/ICacheService'
import { 
  IPerformanceMonitor, 
  RequestMetric, 
  PerformanceMetrics, 
  PerformanceAlert 
} from '@woodie/application/infrastructure/interfaces/IPerformanceMonitor'

/**
 * 성능 임계값 설정
 */
export interface PerformanceThresholds {
  responseTime: {
    warning: number
    critical: number
  }
  errorRate: {
    warning: number
    critical: number
  }
  throughput: {
    warning: number
    critical: number
  }
  memory: {
    warning: number
    critical: number
  }
}

/**
 * 성능 설정
 */
export interface PerformanceConfig {
  enabled: boolean
  bufferSize: number
  thresholds: PerformanceThresholds
}

/**
 * 환형 버퍼 (Infrastructure Layer 유틸리티)
 */
class CircularBuffer<T> {
  private buffer: T[] = []
  private pointer = 0
  private count = 0

  constructor(private readonly size: number) {}

  push(item: T): void {
    this.buffer[this.pointer] = item
    this.pointer = (this.pointer + 1) % this.size
    if (this.count < this.size) {
      this.count++
    }
  }

  toArray(): T[] {
    if (this.count < this.size) {
      return this.buffer.slice(0, this.count)
    }
    return [...this.buffer.slice(this.pointer), ...this.buffer.slice(0, this.pointer)]
  }

  clear(): void {
    this.buffer = []
    this.pointer = 0
    this.count = 0
  }

  get length(): number {
    return this.count
  }

  filter(predicate: (item: T) => boolean): T[] {
    return this.toArray().filter(predicate)
  }
}

/**
 * 비동기 락 (Infrastructure Layer 유틸리티)
 */
class AsyncLock {
  private locks = new Map<string, Promise<any>>()

  async acquire<T>(key: string, fn: () => Promise<T>): Promise<T> {
    while (this.locks.has(key)) {
      await this.locks.get(key)
    }

    const promise = fn()
    this.locks.set(key, promise)
    
    try {
      return await promise
    } finally {
      this.locks.delete(key)
    }
  }
}

/**
 * 성능 모니터링 구현체 (Infrastructure Layer)
 * Application Layer의 IPerformanceMonitor 인터페이스를 구현
 */
export class PerformanceMonitor implements IPerformanceMonitor {
  private readonly requestBuffer: CircularBuffer<RequestMetric>
  private readonly asyncLock: AsyncLock
  private readonly startTime: Date
  private readonly thresholds: PerformanceThresholds
  private totalRequests = 0

  constructor(
    private readonly cacheService: ICacheService,
    private readonly config: PerformanceConfig
  ) {
    this.requestBuffer = new CircularBuffer<RequestMetric>(config.bufferSize)
    this.asyncLock = new AsyncLock()
    this.startTime = new Date()
    this.thresholds = config.thresholds
  }

  /**
   * 요청 메트릭 기록 (Application 인터페이스 구현)
   */
  recordRequest(metric: RequestMetric): void {
    if (!this.config.enabled) return

    try {
      this.requestBuffer.push(metric)
      this.totalRequests++
    } catch (error) {
      // Infrastructure에서는 로깅만 하고 예외를 다시 던지지 않음
      console.error('Failed to record request metric:', error)
    }
  }

  /**
   * 성능 메트릭 조회 (Application 인터페이스 구현)
   */
  async getMetrics(timeRangeMinutes: number = 60): Promise<PerformanceMetrics> {
    return this.asyncLock.acquire('get_metrics', async () => {
      const cutoffTime = new Date(Date.now() - timeRangeMinutes * 60 * 1000)
      
      // 시간 범위 내의 요청들만 필터링
      const recentRequests = this.requestBuffer.filter(
        request => request.timestamp >= cutoffTime
      )

      if (recentRequests.length === 0) {
        return this.createEmptyMetrics(cutoffTime)
      }

      // 응답 시간 메트릭 계산
      const responseTimes = recentRequests
        .map(req => req.responseTime)
        .sort((a, b) => a - b)

      const responseTimeMetrics = {
        avg: this.calculateAverage(responseTimes),
        min: responseTimes[0] || 0,
        max: responseTimes[responseTimes.length - 1] || 0,
        p50: this.calculatePercentile(responseTimes, 50),
        p95: this.calculatePercentile(responseTimes, 95),
        p99: this.calculatePercentile(responseTimes, 99)
      }

      // 처리량 메트릭 계산
      const throughputMetrics = {
        requestsPerSecond: recentRequests.length / (timeRangeMinutes * 60),
        totalRequests: recentRequests.length
      }

      // 에러율 메트릭 계산
      const errorRequests = recentRequests.filter(req => req.statusCode >= 400)
      const client4xxErrors = recentRequests.filter(req => req.statusCode >= 400 && req.statusCode < 500)
      const server5xxErrors = recentRequests.filter(req => req.statusCode >= 500)
      
      const errorRateMetrics = {
        percentage: (errorRequests.length / recentRequests.length) * 100,
        total: errorRequests.length,
        by4xx: client4xxErrors.length,
        by5xx: server5xxErrors.length
      }

      // 메모리 사용량 메트릭
      const memoryUsage = process.memoryUsage()
      const memoryUsageMetrics = {
        usedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        totalMB: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
      }

      return {
        responseTime: responseTimeMetrics,
        throughput: throughputMetrics,
        errorRate: errorRateMetrics,
        memoryUsage: memoryUsageMetrics,
        timeRange: {
          start: cutoffTime,
          end: new Date()
        }
      }
    })
  }

  /**
   * 실시간 성능 알림 확인 (Application 인터페이스 구현)
   */
  async checkAlerts(): Promise<PerformanceAlert[]> {
    return this.asyncLock.acquire('check_alerts', async () => {
      const alerts: PerformanceAlert[] = []
      const metrics = await this.getMetrics(5) // 최근 5분

      // 응답 시간 알림 체크
      if (metrics.responseTime.avg > this.thresholds.responseTime.critical) {
        alerts.push(this.createAlert(
          'high_response_time',
          'critical',
          `평균 응답 시간이 임계값을 초과했습니다 (${metrics.responseTime.avg.toFixed(2)}ms)`,
          metrics.responseTime.avg,
          this.thresholds.responseTime.critical
        ))
      } else if (metrics.responseTime.avg > this.thresholds.responseTime.warning) {
        alerts.push(this.createAlert(
          'high_response_time',
          'high',
          `평균 응답 시간이 경고 수준입니다 (${metrics.responseTime.avg.toFixed(2)}ms)`,
          metrics.responseTime.avg,
          this.thresholds.responseTime.warning
        ))
      }

      // 에러율 알림 체크
      if (metrics.errorRate.percentage > this.thresholds.errorRate.critical) {
        alerts.push(this.createAlert(
          'high_error_rate',
          'critical',
          `에러율이 임계값을 초과했습니다 (${metrics.errorRate.percentage.toFixed(1)}%)`,
          metrics.errorRate.percentage,
          this.thresholds.errorRate.critical
        ))
      } else if (metrics.errorRate.percentage > this.thresholds.errorRate.warning) {
        alerts.push(this.createAlert(
          'high_error_rate',
          'medium',
          `에러율이 경고 수준입니다 (${metrics.errorRate.percentage.toFixed(1)}%)`,
          metrics.errorRate.percentage,
          this.thresholds.errorRate.warning
        ))
      }

      // 메모리 사용량 알림 체크
      if (metrics.memoryUsage.percentage > this.thresholds.memory.critical) {
        alerts.push(this.createAlert(
          'high_memory_usage',
          'critical',
          `메모리 사용률이 임계값을 초과했습니다 (${metrics.memoryUsage.percentage.toFixed(1)}%)`,
          metrics.memoryUsage.percentage,
          this.thresholds.memory.critical
        ))
      } else if (metrics.memoryUsage.percentage > this.thresholds.memory.warning) {
        alerts.push(this.createAlert(
          'high_memory_usage',
          'medium',
          `메모리 사용률이 경고 수준입니다 (${metrics.memoryUsage.percentage.toFixed(1)}%)`,
          metrics.memoryUsage.percentage,
          this.thresholds.memory.warning
        ))
      }

      // 처리량 알림 체크 (낮은 처리량)
      if (metrics.throughput.requestsPerSecond < this.thresholds.throughput.critical) {
        alerts.push(this.createAlert(
          'low_throughput',
          'critical',
          `처리량이 임계값 미만입니다 (${metrics.throughput.requestsPerSecond.toFixed(2)} req/s)`,
          metrics.throughput.requestsPerSecond,
          this.thresholds.throughput.critical
        ))
      }

      return alerts
    })
  }

  /**
   * 메트릭 데이터 정리 (Application 인터페이스 구현)
   */
  async cleanup(olderThanHours: number = 24): Promise<number> {
    return this.asyncLock.acquire('cleanup', async () => {
      const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000)
      const allRequests = this.requestBuffer.toArray()
      const oldRequestCount = allRequests.filter(req => req.timestamp < cutoffTime).length
      
      // 오래된 요청들 제거
      this.requestBuffer.clear()
      allRequests
        .filter(req => req.timestamp >= cutoffTime)
        .forEach(req => this.requestBuffer.push(req))
      
      // 캐시된 데이터도 정리
      const pattern = CacheKeys.SYSTEM_STATS('*')
      await this.cacheService.invalidatePattern(pattern)
      
      return oldRequestCount
    })
  }

  /**
   * 모니터링 상태 확인 (Application 인터페이스 구현)
   */
  getStatus(): { isRunning: boolean; startTime: Date; totalRecords: number } {
    return {
      isRunning: this.config.enabled,
      startTime: this.startTime,
      totalRecords: this.totalRequests
    }
  }

  /**
   * 평균값 계산 (Private 유틸리티 메서드)
   */
  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length
  }

  /**
   * 백분위수 계산 (Private 유틸리티 메서드)
   */
  private calculatePercentile(sortedNumbers: number[], percentile: number): number {
    if (sortedNumbers.length === 0) return 0
    
    const index = Math.ceil((percentile / 100) * sortedNumbers.length) - 1
    return sortedNumbers[Math.max(0, index)]
  }

  /**
   * 빈 메트릭 생성 (Private 유틸리티 메서드)
   */
  private createEmptyMetrics(startTime: Date): PerformanceMetrics {
    return {
      responseTime: { avg: 0, min: 0, max: 0, p50: 0, p95: 0, p99: 0 },
      throughput: { requestsPerSecond: 0, totalRequests: 0 },
      errorRate: { percentage: 0, total: 0, by4xx: 0, by5xx: 0 },
      memoryUsage: { usedMB: 0, totalMB: 0, percentage: 0 },
      timeRange: { start: startTime, end: new Date() }
    }
  }

  /**
   * 알림 생성 (Private 유틸리티 메서드)
   */
  private createAlert(
    type: PerformanceAlert['type'],
    severity: PerformanceAlert['severity'],
    message: string,
    value: number,
    threshold: number
  ): PerformanceAlert {
    return {
      type,
      severity,
      message,
      value,
      threshold,
      timestamp: new Date()
    }
  }
}

/**
 * 설정 로더 (Infrastructure Layer 팩토리)
 */
export class PerformanceConfigLoader {
  static load(): PerformanceConfig {
    return {
      enabled: process.env.PERFORMANCE_MONITORING !== 'false',
      bufferSize: parseInt(process.env.PERF_BUFFER_SIZE || '10000'),
      thresholds: {
        responseTime: {
          warning: parseInt(process.env.PERF_RESPONSE_TIME_WARNING || '1000'),
          critical: parseInt(process.env.PERF_RESPONSE_TIME_CRITICAL || '5000')
        },
        errorRate: {
          warning: parseFloat(process.env.PERF_ERROR_RATE_WARNING || '5.0'),
          critical: parseFloat(process.env.PERF_ERROR_RATE_CRITICAL || '10.0')
        },
        throughput: {
          warning: parseInt(process.env.PERF_THROUGHPUT_WARNING || '100'),
          critical: parseInt(process.env.PERF_THROUGHPUT_CRITICAL || '50')
        },
        memory: {
          warning: parseFloat(process.env.PERF_MEMORY_WARNING || '80.0'),
          critical: parseFloat(process.env.PERF_MEMORY_CRITICAL || '90.0')
        }
      }
    }
  }
}