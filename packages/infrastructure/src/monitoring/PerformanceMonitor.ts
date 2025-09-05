import { ILogger } from '@woodie/application/common/interfaces/ILogger';
import { Result } from '@woodie/domain/common/Result';
import { MetricsCollector } from './MetricsCollector';

export interface PerformanceMetric {
  operationType: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  success: boolean;
  errorType?: string;
  metadata: Record<string, any>;
  resourceUsage: {
    cpuUsage?: number;
    memoryUsage?: number;
    networkIO?: number;
    diskIO?: number;
  };
}

export interface PerformanceBenchmark {
  operationType: string;
  targetResponseTime: number;
  maxErrorRate: number;
  maxCpuUsage: number;
  maxMemoryUsage: number;
  throughputTarget: number;
}

export interface PerformanceReport {
  operationType: string;
  period: { start: Date; end: Date };
  metrics: {
    averageResponseTime: number;
    medianResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    errorRate: number;
    successRate: number;
    throughput: number;
    totalOperations: number;
  };
  resourceUsage: {
    averageCpuUsage: number;
    averageMemoryUsage: number;
    peakCpuUsage: number;
    peakMemoryUsage: number;
  };
  benchmarkComparison: {
    meetsBenchmark: boolean;
    deviations: Array<{
      metric: string;
      target: number;
      actual: number;
      deviation: number;
    }>;
  };
  trends: {
    responseTimeTrend: 'improving' | 'degrading' | 'stable';
    errorRateTrend: 'improving' | 'degrading' | 'stable';
    throughputTrend: 'improving' | 'degrading' | 'stable';
  };
}

export class PerformanceMonitor {
  private readonly logger: ILogger;
  private readonly metricsCollector: MetricsCollector;
  private readonly performanceMetrics: PerformanceMetric[] = [];
  private readonly benchmarks: Map<string, PerformanceBenchmark> = new Map();
  private readonly activeOperations: Map<string, { startTime: Date; metadata: Record<string, any> }> = new Map();
  private readonly retentionPeriodMs: number;

  constructor(
    logger: ILogger,
    metricsCollector: MetricsCollector,
    retentionPeriodMs: number = 7 * 24 * 60 * 60 * 1000 // 7일
  ) {
    this.logger = logger;
    this.metricsCollector = metricsCollector;
    this.retentionPeriodMs = retentionPeriodMs;
    
    this.initializeDefaultBenchmarks();
    this.startResourceMonitoring();
    this.startCleanupTimer();
  }

  // 자동 성능 측정 데코레이터
  measurePerformance<T>(
    operationType: string,
    operation: () => Promise<T>,
    metadata: Record<string, any> = {}
  ): Promise<T> {
    const operationId = this.generateOperationId();
    this.startOperation(operationId, operationType, metadata);

    return operation()
      .then(result => {
        this.endOperation(operationId, true, undefined, { resultType: typeof result });
        return result;
      })
      .catch(error => {
        const errorType = error instanceof Error ? error.constructor.name : 'Unknown';
        this.endOperation(operationId, false, errorType, { 
          errorMessage: error instanceof Error ? error.message : String(error) 
        });
        throw error;
      });
  }

  // 성능 리포트 생성
  async generatePerformanceReport(
    operationType: string,
    fromDate?: Date,
    toDate?: Date
  ): Promise<Result<PerformanceReport>> {
    try {
      const now = new Date();
      const from = fromDate || new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const to = toDate || now;

      const filteredMetrics = this.performanceMetrics.filter(metric =>
        metric.operationType === operationType &&
        metric.startTime >= from &&
        metric.endTime <= to
      );

      if (filteredMetrics.length === 0) {
        return Result.fail<PerformanceReport>('No performance data available');
      }

      const durations = filteredMetrics.map(m => m.duration).sort((a, b) => a - b);
      const successfulOperations = filteredMetrics.filter(m => m.success);
      
      const averageResponseTime = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      const medianResponseTime = durations[Math.floor(durations.length / 2)];
      const errorRate = ((filteredMetrics.length - successfulOperations.length) / filteredMetrics.length) * 100;

      const report: PerformanceReport = {
        operationType,
        period: { start: from, end: to },
        metrics: {
          averageResponseTime,
          medianResponseTime,
          p95ResponseTime: durations[Math.floor(durations.length * 0.95)],
          p99ResponseTime: durations[Math.floor(durations.length * 0.99)],
          errorRate,
          successRate: 100 - errorRate,
          throughput: filteredMetrics.length / ((to.getTime() - from.getTime()) / (1000 * 60 * 60)),
          totalOperations: filteredMetrics.length
        },
        resourceUsage: {
          averageCpuUsage: 0,
          averageMemoryUsage: 0,
          peakCpuUsage: 0,
          peakMemoryUsage: 0
        },
        benchmarkComparison: {
          meetsBenchmark: true,
          deviations: []
        },
        trends: {
          responseTimeTrend: 'stable',
          errorRateTrend: 'stable',
          throughputTrend: 'stable'
        }
      };

      return Result.ok(report);

    } catch (error) {
      this.logger.error('Failed to generate performance report', {
        error: error instanceof Error ? error.message : String(error)
      });
      return Result.fail<PerformanceReport>('Failed to generate performance report');
    }
  }

  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private startOperation(operationId: string, operationType: string, metadata: Record<string, any>): void {
    this.activeOperations.set(operationId, {
      startTime: new Date(),
      metadata: { ...metadata, operationType }
    });
  }

  private endOperation(operationId: string, success: boolean, errorType?: string, additionalMetadata?: Record<string, any>): void {
    const operation = this.activeOperations.get(operationId);
    if (!operation) return;

    const endTime = new Date();
    const duration = endTime.getTime() - operation.startTime.getTime();

    const performanceMetric: PerformanceMetric = {
      operationType: operation.metadata.operationType,
      startTime: operation.startTime,
      endTime,
      duration,
      success,
      errorType,
      metadata: { ...operation.metadata, ...additionalMetadata },
      resourceUsage: { cpuUsage: 0, memoryUsage: 0, networkIO: 0, diskIO: 0 }
    };

    this.performanceMetrics.push(performanceMetric);
    this.activeOperations.delete(operationId);

    this.metricsCollector.recordDuration(
      `operation_duration_${operation.metadata.operationType}`,
      duration,
      { success: success.toString() }
    );
  }

  private initializeDefaultBenchmarks(): void {
    // 기본 벤치마크 설정
  }

  private startResourceMonitoring(): void {
    // 리소스 모니터링 시작
  }

  private startCleanupTimer(): void {
    // 정리 타이머 시작
  }
}