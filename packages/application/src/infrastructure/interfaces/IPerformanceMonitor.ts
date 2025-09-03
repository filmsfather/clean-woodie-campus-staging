/**
 * 성능 모니터링 인터페이스
 * 구현 세부사항을 숨기는 추상화 레이어
 */

export interface RequestMetric {
  timestamp: Date
  responseTime: number
  statusCode: number
  endpoint?: string
  userId?: string
}

export interface PerformanceMetrics {
  responseTime: {
    avg: number
    min: number
    max: number
    p50: number
    p95: number
    p99: number
  }
  throughput: {
    requestsPerSecond: number
    totalRequests: number
  }
  errorRate: {
    percentage: number
    total: number
    by4xx: number
    by5xx: number
  }
  memoryUsage: {
    usedMB: number
    totalMB: number
    percentage: number
  }
  timeRange: {
    start: Date
    end: Date
  }
}

export interface PerformanceAlert {
  type: 'high_response_time' | 'high_error_rate' | 'high_memory_usage' | 'low_throughput'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  value: number
  threshold: number
  timestamp: Date
}

export interface IPerformanceMonitor {
  /**
   * 요청 메트릭 기록
   */
  recordRequest(metric: RequestMetric): void

  /**
   * 성능 메트릭 조회
   */
  getMetrics(timeRangeMinutes?: number): Promise<PerformanceMetrics>

  /**
   * 실시간 성능 알림 확인
   */
  checkAlerts(): Promise<PerformanceAlert[]>

  /**
   * 메트릭 데이터 정리
   */
  cleanup(olderThanHours?: number): Promise<number>

  /**
   * 모니터링 상태 확인
   */
  getStatus(): {
    isRunning: boolean
    startTime: Date
    totalRecords: number
  }
}