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
    period: {
        start: Date;
        end: Date;
    };
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
export declare class PerformanceMonitor {
    private readonly logger;
    private readonly metricsCollector;
    private readonly performanceMetrics;
    private readonly benchmarks;
    private readonly activeOperations;
    private readonly retentionPeriodMs;
    constructor(logger: ILogger, metricsCollector: MetricsCollector, retentionPeriodMs?: number);
    measurePerformance<T>(operationType: string, operation: () => Promise<T>, metadata?: Record<string, any>): Promise<T>;
    generatePerformanceReport(operationType: string, fromDate?: Date, toDate?: Date): Promise<Result<PerformanceReport>>;
    private generateOperationId;
    private startOperation;
    private endOperation;
    private initializeDefaultBenchmarks;
    private startResourceMonitoring;
    private startCleanupTimer;
}
//# sourceMappingURL=PerformanceMonitor.d.ts.map