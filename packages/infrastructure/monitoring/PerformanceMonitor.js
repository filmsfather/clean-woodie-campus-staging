import { Result } from '@woodie/domain/common/Result';
export class PerformanceMonitor {
    logger;
    metricsCollector;
    performanceMetrics = [];
    benchmarks = new Map();
    activeOperations = new Map();
    retentionPeriodMs;
    constructor(logger, metricsCollector, retentionPeriodMs = 7 * 24 * 60 * 60 * 1000 // 7일
    ) {
        this.logger = logger;
        this.metricsCollector = metricsCollector;
        this.retentionPeriodMs = retentionPeriodMs;
        this.initializeDefaultBenchmarks();
        this.startResourceMonitoring();
        this.startCleanupTimer();
    }
    // 자동 성능 측정 데코레이터
    measurePerformance(operationType, operation, metadata = {}) {
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
    async generatePerformanceReport(operationType, fromDate, toDate) {
        try {
            const now = new Date();
            const from = fromDate || new Date(now.getTime() - 24 * 60 * 60 * 1000);
            const to = toDate || now;
            const filteredMetrics = this.performanceMetrics.filter(metric => metric.operationType === operationType &&
                metric.startTime >= from &&
                metric.endTime <= to);
            if (filteredMetrics.length === 0) {
                return Result.fail('No performance data available');
            }
            const durations = filteredMetrics.map(m => m.duration).sort((a, b) => a - b);
            const successfulOperations = filteredMetrics.filter(m => m.success);
            const averageResponseTime = durations.reduce((sum, d) => sum + d, 0) / durations.length;
            const medianResponseTime = durations[Math.floor(durations.length / 2)];
            const errorRate = ((filteredMetrics.length - successfulOperations.length) / filteredMetrics.length) * 100;
            const report = {
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
        }
        catch (error) {
            this.logger.error('Failed to generate performance report', {
                error: error instanceof Error ? error.message : String(error)
            });
            return Result.fail('Failed to generate performance report');
        }
    }
    generateOperationId() {
        return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    startOperation(operationId, operationType, metadata) {
        this.activeOperations.set(operationId, {
            startTime: new Date(),
            metadata: { ...metadata, operationType }
        });
    }
    endOperation(operationId, success, errorType, additionalMetadata) {
        const operation = this.activeOperations.get(operationId);
        if (!operation)
            return;
        const endTime = new Date();
        const duration = endTime.getTime() - operation.startTime.getTime();
        const performanceMetric = {
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
        this.metricsCollector.recordDuration(`operation_duration_${operation.metadata.operationType}`, duration, { success: success.toString() });
    }
    initializeDefaultBenchmarks() {
        // 기본 벤치마크 설정
    }
    startResourceMonitoring() {
        // 리소스 모니터링 시작
    }
    startCleanupTimer() {
        // 정리 타이머 시작
    }
}
//# sourceMappingURL=PerformanceMonitor.js.map