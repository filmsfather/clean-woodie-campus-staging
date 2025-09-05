import { Result } from '@woodie/domain/common/Result';
export class BatchProcessor {
    logger;
    config;
    metrics;
    circuitBreakerOpen = false;
    circuitBreakerLastFailure = 0;
    consecutiveFailures = 0;
    constructor(logger, config = {}) {
        this.logger = logger;
        this.config = {
            batchSize: 100,
            maxConcurrency: 5,
            retryAttempts: 3,
            retryDelay: 1000,
            timeoutMs: 30000,
            enableCircuitBreaker: true,
            circuitBreakerThreshold: 5,
            circuitBreakerResetTime: 60000,
            ...config
        };
        this.metrics = {
            totalBatches: 0,
            totalItems: 0,
            successRate: 0,
            averageBatchSize: 0,
            averageProcessingTime: 0,
            peakThroughput: 0
        };
    }
    async processBatch(items, processor, options = {}) {
        const startTime = Date.now();
        const totalItems = items.length;
        this.logger.info('Starting batch processing', {
            totalItems,
            batchSize: this.config.batchSize,
            maxConcurrency: this.config.maxConcurrency
        });
        if (this.isCircuitBreakerOpen()) {
            return Result.fail('Circuit breaker is open - too many recent failures');
        }
        try {
            const batches = this.createBatches(items);
            const processed = [];
            const failed = [];
            let processedCount = 0;
            if (options.preserveOrder) {
                // 순서 보장이 필요한 경우 순차 처리
                for (let i = 0; i < batches.length; i++) {
                    const batch = batches[i];
                    const result = await this.processBatchWithRetry(batch, processor);
                    if (result.isSuccess) {
                        processed.push(...result.getValue());
                        processedCount += batch.length;
                    }
                    else {
                        if (options.continueOnError) {
                            batch.forEach(item => failed.push({
                                item: item,
                                error: new Error(result.getErrorValue()),
                                attempts: this.config.retryAttempts
                            }));
                        }
                        else {
                            return Result.fail(result.getErrorValue());
                        }
                    }
                    options.progressCallback?.(processedCount, totalItems);
                    this.logger.debug('Batch processed sequentially', {
                        batchIndex: i + 1,
                        totalBatches: batches.length,
                        processedCount,
                        totalItems
                    });
                }
            }
            else {
                // 병렬 처리 (기본값)
                const results = await this.processInParallel(batches, processor, options);
                results.forEach(result => {
                    if (result.isSuccess) {
                        processed.push(...result.getValue());
                    }
                    else {
                        // 실패한 배치의 개별 항목들을 failed 배열에 추가
                        // 실제 구현에서는 배치와 개별 항목 매핑 정보가 필요
                    }
                });
                processedCount = processed.length;
                options.progressCallback?.(processedCount, totalItems);
            }
            const endTime = Date.now();
            const duration = endTime - startTime;
            const throughput = totalItems / (duration / 1000);
            // 메트릭 업데이트
            this.updateMetrics(batches.length, totalItems, duration, throughput);
            // 회로 차단기 상태 업데이트
            if (failed.length === 0) {
                this.resetCircuitBreaker();
            }
            else {
                this.recordFailure();
            }
            const batchResult = {
                processed,
                failed,
                totalProcessed: processed.length,
                totalFailed: failed.length,
                duration,
                throughput
            };
            this.logger.info('Batch processing completed', {
                totalItems,
                processed: processed.length,
                failed: failed.length,
                duration,
                throughput: Math.round(throughput)
            });
            return Result.ok(batchResult);
        }
        catch (error) {
            this.recordFailure();
            this.logger.error('Batch processing failed', {
                error: error instanceof Error ? error.message : String(error),
                totalItems
            });
            return Result.fail('Batch processing failed');
        }
    }
    // 특정 조건을 만족하는 항목들만 배치 처리
    async processConditionalBatch(items, condition, processor, options) {
        const filteredItems = items.filter(condition);
        const skippedItems = items.filter(item => !condition(item));
        this.logger.info('Starting conditional batch processing', {
            totalItems: items.length,
            filteredItems: filteredItems.length,
            skippedItems: skippedItems.length
        });
        const result = await this.processBatch(filteredItems, processor, options);
        if (result.isFailure) {
            return Result.fail(result.getErrorValue());
        }
        return Result.ok({
            processed: result.getValue(),
            skipped: skippedItems
        });
    }
    // 데이터베이스 배치 업데이트를 위한 특화된 메서드
    async processDatabaseBatch(items, processor, options = {}) {
        const enhancedProcessor = async (batch) => {
            try {
                // 트랜잭션 콜백 실행 (예: BEGIN TRANSACTION)
                if (options.transactionCallback) {
                    await options.transactionCallback();
                }
                const result = await processor(batch);
                return result;
            }
            catch (error) {
                // 데드락 감지 및 재시도
                if (options.deadlockRetry && this.isDeadlockError(error)) {
                    this.logger.warn('Deadlock detected, retrying batch', {
                        batchSize: batch.length,
                        error: error instanceof Error ? error.message : String(error)
                    });
                    // 짧은 지연 후 재시도
                    await this.delay(Math.random() * 1000 + 500);
                    return processor(batch);
                }
                throw error;
            }
        };
        return this.processBatch(items, enhancedProcessor, {
            preserveOrder: true, // DB 작업은 일반적으로 순서 보장 필요
            continueOnError: false, // DB 작업 실패시 전체 중단
        });
    }
    // 메트릭 조회
    getMetrics() {
        return { ...this.metrics };
    }
    // 메트릭 리셋
    resetMetrics() {
        this.metrics.totalBatches = 0;
        this.metrics.totalItems = 0;
        this.metrics.successRate = 0;
        this.metrics.averageBatchSize = 0;
        this.metrics.averageProcessingTime = 0;
        this.metrics.peakThroughput = 0;
    }
    createBatches(items) {
        const batches = [];
        for (let i = 0; i < items.length; i += this.config.batchSize) {
            batches.push(items.slice(i, i + this.config.batchSize));
        }
        return batches;
    }
    async processBatchWithRetry(batch, processor) {
        let lastError;
        for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
            try {
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Batch processing timeout')), this.config.timeoutMs));
                const processingPromise = processor(batch);
                const result = await Promise.race([processingPromise, timeoutPromise]);
                this.logger.debug('Batch processed successfully', {
                    batchSize: batch.length,
                    attempt
                });
                return Result.ok(result);
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                if (attempt < this.config.retryAttempts) {
                    this.logger.warn('Batch processing failed, retrying', {
                        attempt,
                        maxAttempts: this.config.retryAttempts,
                        batchSize: batch.length,
                        error: lastError.message
                    });
                    await this.delay(this.config.retryDelay * attempt);
                }
            }
        }
        this.logger.error('Batch processing failed after all retry attempts', {
            batchSize: batch.length,
            maxAttempts: this.config.retryAttempts,
            error: lastError.message
        });
        return Result.fail(`Batch processing failed: ${lastError.message}`);
    }
    async processInParallel(batches, processor, options) {
        const semaphore = new Semaphore(this.config.maxConcurrency);
        const promises = batches.map(async (batch, index) => {
            await semaphore.acquire();
            try {
                const result = await this.processBatchWithRetry(batch, processor);
                if (options.progressCallback) {
                    const processedSoFar = (index + 1) * this.config.batchSize;
                    const totalItems = batches.length * this.config.batchSize;
                    options.progressCallback(Math.min(processedSoFar, totalItems), totalItems);
                }
                return result;
            }
            finally {
                semaphore.release();
            }
        });
        return Promise.all(promises);
    }
    updateMetrics(batchCount, itemCount, duration, throughput) {
        this.metrics.totalBatches += batchCount;
        this.metrics.totalItems += itemCount;
        // 이동 평균으로 업데이트
        const alpha = 0.1; // 지수 이동 평균 계수
        this.metrics.averageBatchSize =
            (1 - alpha) * this.metrics.averageBatchSize + alpha * (itemCount / batchCount);
        this.metrics.averageProcessingTime =
            (1 - alpha) * this.metrics.averageProcessingTime + alpha * duration;
        this.metrics.peakThroughput = Math.max(this.metrics.peakThroughput, throughput);
        // 성공률 계산 (간단한 근사치)
        this.metrics.successRate = (this.metrics.successRate * 0.9) + (1.0 * 0.1);
    }
    isCircuitBreakerOpen() {
        if (!this.config.enableCircuitBreaker) {
            return false;
        }
        if (this.circuitBreakerOpen) {
            const timeSinceLastFailure = Date.now() - this.circuitBreakerLastFailure;
            if (timeSinceLastFailure > this.config.circuitBreakerResetTime) {
                this.logger.info('Circuit breaker reset - attempting recovery');
                this.circuitBreakerOpen = false;
                this.consecutiveFailures = 0;
                return false;
            }
            return true;
        }
        return false;
    }
    recordFailure() {
        if (!this.config.enableCircuitBreaker) {
            return;
        }
        this.consecutiveFailures++;
        this.circuitBreakerLastFailure = Date.now();
        if (this.consecutiveFailures >= this.config.circuitBreakerThreshold) {
            this.circuitBreakerOpen = true;
            this.logger.error('Circuit breaker opened due to consecutive failures', {
                consecutiveFailures: this.consecutiveFailures,
                threshold: this.config.circuitBreakerThreshold
            });
        }
    }
    resetCircuitBreaker() {
        if (this.consecutiveFailures > 0) {
            this.logger.info('Circuit breaker reset - operations successful');
            this.consecutiveFailures = 0;
            this.circuitBreakerOpen = false;
        }
    }
    isDeadlockError(error) {
        if (error && typeof error.message === 'string') {
            return error.message.toLowerCase().includes('deadlock') ||
                error.message.includes('40P01') || // PostgreSQL deadlock error code
                error.message.includes('40001'); // Serialization failure
        }
        return false;
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
// 세마포어 유틸리티 클래스
class Semaphore {
    permits;
    waitQueue = [];
    constructor(permits) {
        this.permits = permits;
    }
    async acquire() {
        if (this.permits > 0) {
            this.permits--;
            return;
        }
        return new Promise(resolve => {
            this.waitQueue.push(resolve);
        });
    }
    release() {
        this.permits++;
        if (this.waitQueue.length > 0) {
            this.permits--;
            const resolve = this.waitQueue.shift();
            resolve();
        }
    }
}
// 배치 처리를 위한 헬퍼 함수들
export class BatchUtils {
    // 배열을 청크로 나누기
    static chunk(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }
    // 배치 처리 진행률 추적기
    static createProgressTracker(total, logger) {
        let lastReported = 0;
        const reportInterval = Math.max(1, Math.floor(total * 0.1)); // 10% 간격으로 리포트
        return (processed) => {
            if (processed - lastReported >= reportInterval || processed === total) {
                const percentage = Math.round((processed / total) * 100);
                logger.info(`Batch processing progress: ${processed}/${total} (${percentage}%)`);
                lastReported = processed;
            }
        };
    }
    // 배치 크기 최적화 (메모리 사용량 기반)
    static optimizeBatchSize(itemSize, availableMemoryMB, maxBatchSize = 1000) {
        const itemSizeMB = itemSize / (1024 * 1024);
        const safeMemoryUsage = availableMemoryMB * 0.8; // 80%만 사용
        const calculatedSize = Math.floor(safeMemoryUsage / itemSizeMB);
        return Math.min(calculatedSize, maxBatchSize);
    }
}
//# sourceMappingURL=BatchProcessor.js.map