import { ILogger } from '@woodie/application/common/interfaces/ILogger';
import { Result } from '@woodie/domain/common/Result';
export interface BatchProcessorConfig {
    batchSize: number;
    maxConcurrency: number;
    retryAttempts: number;
    retryDelay: number;
    timeoutMs: number;
    enableCircuitBreaker?: boolean;
    circuitBreakerThreshold?: number;
    circuitBreakerResetTime?: number;
}
export interface BatchResult<T> {
    processed: T[];
    failed: Array<{
        item: T;
        error: Error;
        attempts: number;
    }>;
    totalProcessed: number;
    totalFailed: number;
    duration: number;
    throughput: number;
}
export interface BatchMetrics {
    totalBatches: number;
    totalItems: number;
    successRate: number;
    averageBatchSize: number;
    averageProcessingTime: number;
    peakThroughput: number;
}
export declare class BatchProcessor<T> {
    private readonly logger;
    private readonly config;
    private readonly metrics;
    private circuitBreakerOpen;
    private circuitBreakerLastFailure;
    private consecutiveFailures;
    constructor(logger: ILogger, config?: Partial<BatchProcessorConfig>);
    processBatch<R>(items: T[], processor: (batch: T[]) => Promise<R[]>, options?: {
        preserveOrder?: boolean;
        continueOnError?: boolean;
        progressCallback?: (processed: number, total: number) => void;
    }): Promise<Result<BatchResult<R>>>;
    processConditionalBatch<R>(items: T[], condition: (item: T) => boolean, processor: (batch: T[]) => Promise<R[]>, options?: {
        preserveOrder?: boolean;
        continueOnError?: boolean;
        progressCallback?: (processed: number, total: number) => void;
    }): Promise<Result<{
        processed: BatchResult<R>;
        skipped: T[];
    }>>;
    processDatabaseBatch<R>(items: T[], processor: (batch: T[]) => Promise<R[]>, options?: {
        transactionCallback?: () => Promise<void>;
        deadlockRetry?: boolean;
        isolationLevel?: 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE';
    }): Promise<Result<BatchResult<R>>>;
    getMetrics(): BatchMetrics;
    resetMetrics(): void;
    private createBatches;
    private processBatchWithRetry;
    private processInParallel;
    private updateMetrics;
    private isCircuitBreakerOpen;
    private recordFailure;
    private resetCircuitBreaker;
    private isDeadlockError;
    private delay;
}
export declare class BatchUtils {
    static chunk<T>(array: T[], size: number): T[][];
    static createProgressTracker(total: number, logger: ILogger): (processed: number) => void;
    static optimizeBatchSize(itemSize: number, availableMemoryMB: number, maxBatchSize?: number): number;
}
//# sourceMappingURL=BatchProcessor.d.ts.map