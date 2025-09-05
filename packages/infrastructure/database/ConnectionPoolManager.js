import { Result } from '@woodie/domain/common/Result';
export class ConnectionPoolManager {
    supabase;
    logger;
    config;
    metrics;
    healthCheckHistory = [];
    healthCheckTimer;
    isShuttingDown = false;
    constructor(supabaseClient, logger, config = {}) {
        this.supabase = supabaseClient;
        this.logger = logger;
        this.config = {
            maxConnections: 20,
            minConnections: 5,
            connectionTimeoutMs: 10000,
            idleTimeoutMs: 300000, // 5분
            maxLifetimeMs: 3600000, // 1시간
            healthCheckIntervalMs: 30000, // 30초
            enableMonitoring: true,
            enableConnectionRetry: true,
            retryAttempts: 3,
            retryDelayMs: 1000,
            ...config
        };
        this.metrics = {
            totalConnections: 0,
            activeConnections: 0,
            idleConnections: 0,
            waitingRequests: 0,
            totalRequests: 0,
            failedConnections: 0,
            averageConnectionTime: 0,
            peakConnections: 0,
            connectionErrors: 0
        };
        this.initializeMonitoring();
    }
    // 연결 풀 초기화 및 모니터링 시작
    async initialize() {
        try {
            this.logger.info('Initializing connection pool', {
                maxConnections: this.config.maxConnections,
                minConnections: this.config.minConnections,
                healthCheckInterval: this.config.healthCheckIntervalMs
            });
            // 초기 헬스 체크
            const healthCheck = await this.performHealthCheck();
            if (!healthCheck.isHealthy) {
                return Result.fail('Initial health check failed: ' + healthCheck.error);
            }
            // 주기적 헬스 체크 시작
            if (this.config.enableMonitoring) {
                this.startHealthCheckMonitoring();
            }
            this.logger.info('Connection pool initialized successfully');
            return Result.ok();
        }
        catch (error) {
            this.logger.error('Failed to initialize connection pool', {
                error: error instanceof Error ? error.message : String(error)
            });
            return Result.fail('Connection pool initialization failed');
        }
    }
    // 연결 풀에서 연결 획득
    async acquireConnection(operation, timeoutMs) {
        const startTime = Date.now();
        const timeout = timeoutMs || this.config.connectionTimeoutMs;
        this.metrics.totalRequests++;
        this.metrics.waitingRequests++;
        try {
            this.logger.debug('Acquiring connection from pool', {
                activeConnections: this.metrics.activeConnections,
                maxConnections: this.config.maxConnections,
                waitingRequests: this.metrics.waitingRequests
            });
            // 연결 타임아웃 설정
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => {
                    reject(new Error('Connection acquisition timeout'));
                }, timeout);
            });
            // 실제 연결 작업 실행
            const operationPromise = this.executeWithConnection(operation);
            const result = await Promise.race([operationPromise, timeoutPromise]);
            const connectionTime = Date.now() - startTime;
            this.updateConnectionMetrics(connectionTime, true);
            this.logger.debug('Connection operation completed successfully', {
                duration: connectionTime,
                activeConnections: this.metrics.activeConnections
            });
            return Result.ok(result);
        }
        catch (error) {
            const connectionTime = Date.now() - startTime;
            this.updateConnectionMetrics(connectionTime, false);
            this.logger.error('Connection operation failed', {
                error: error instanceof Error ? error.message : String(error),
                duration: connectionTime,
                activeConnections: this.metrics.activeConnections
            });
            return Result.fail(`Connection operation failed: ${error instanceof Error ? error.message : String(error)}`);
        }
        finally {
            this.metrics.waitingRequests--;
        }
    }
    // 트랜잭션 내에서 여러 작업 실행
    async executeTransaction(operations, isolationLevel) {
        return this.acquireConnection(async (client) => {
            const results = [];
            try {
                // 트랜잭션 시작
                if (isolationLevel) {
                    await client.rpc('begin_transaction_with_isolation', {
                        isolation_level: isolationLevel
                    });
                }
                else {
                    await client.rpc('begin_transaction');
                }
                // 각 작업을 순차적으로 실행
                for (const operation of operations) {
                    const result = await operation(client);
                    results.push(result);
                }
                // 트랜잭션 커밋
                await client.rpc('commit_transaction');
                this.logger.debug('Transaction completed successfully', {
                    operationCount: operations.length
                });
                return results;
            }
            catch (error) {
                // 트랜잭션 롤백
                try {
                    await client.rpc('rollback_transaction');
                }
                catch (rollbackError) {
                    this.logger.error('Failed to rollback transaction', {
                        rollbackError: rollbackError instanceof Error ? rollbackError.message : String(rollbackError)
                    });
                }
                this.logger.error('Transaction failed and rolled back', {
                    error: error instanceof Error ? error.message : String(error),
                    operationCount: operations.length
                });
                throw error;
            }
        });
    }
    // 연결 풀 상태 모니터링
    async getPoolStatus() {
        const recentHealthChecks = this.healthCheckHistory
            .slice(-10)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        const recommendations = this.generateRecommendations();
        return {
            config: { ...this.config },
            metrics: { ...this.metrics },
            healthStatus: recentHealthChecks,
            recommendations
        };
    }
    // 연결 풀 메트릭 리셋
    resetMetrics() {
        Object.assign(this.metrics, {
            totalConnections: 0,
            activeConnections: 0,
            idleConnections: 0,
            waitingRequests: 0,
            totalRequests: 0,
            failedConnections: 0,
            averageConnectionTime: 0,
            peakConnections: 0,
            connectionErrors: 0
        });
        this.healthCheckHistory.length = 0;
        this.logger.info('Connection pool metrics reset');
    }
    // 우아한 종료
    async shutdown() {
        this.isShuttingDown = true;
        this.logger.info('Shutting down connection pool', {
            activeConnections: this.metrics.activeConnections,
            waitingRequests: this.metrics.waitingRequests
        });
        // 헬스 체크 중단
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
        }
        // 활성 연결들이 완료될 때까지 대기 (최대 30초)
        const shutdownTimeout = 30000;
        const startTime = Date.now();
        while (this.metrics.activeConnections > 0 && (Date.now() - startTime) < shutdownTimeout) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        if (this.metrics.activeConnections > 0) {
            this.logger.warn('Force closing remaining connections during shutdown', {
                remainingConnections: this.metrics.activeConnections
            });
        }
        this.logger.info('Connection pool shutdown completed');
    }
    async executeWithConnection(operation) {
        this.metrics.activeConnections++;
        this.metrics.peakConnections = Math.max(this.metrics.peakConnections, this.metrics.activeConnections);
        try {
            // Supabase 클라이언트는 내부적으로 연결 풀을 관리하므로
            // 직접적인 연결 관리보다는 요청 레벨에서 최적화
            const result = await operation(this.supabase);
            return result;
        }
        finally {
            this.metrics.activeConnections--;
        }
    }
    async performHealthCheck() {
        const startTime = Date.now();
        try {
            // 간단한 쿼리로 헬스 체크
            const { data, error } = await this.supabase
                .rpc('health_check')
                .single();
            const responseTime = Date.now() - startTime;
            if (error) {
                throw new Error(error.message);
            }
            const result = {
                isHealthy: true,
                responseTimeMs: responseTime,
                timestamp: new Date()
            };
            return result;
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            const result = {
                isHealthy: false,
                responseTimeMs: responseTime,
                error: error instanceof Error ? error.message : String(error),
                timestamp: new Date()
            };
            this.metrics.connectionErrors++;
            this.logger.error('Health check failed', {
                responseTime,
                error: result.error
            });
            return result;
        }
    }
    startHealthCheckMonitoring() {
        this.healthCheckTimer = setInterval(async () => {
            if (this.isShuttingDown) {
                return;
            }
            const healthCheck = await this.performHealthCheck();
            this.healthCheckHistory.push(healthCheck);
            // 최근 20개 결과만 보관
            if (this.healthCheckHistory.length > 20) {
                this.healthCheckHistory.shift();
            }
            // 연속적인 실패 감지
            const recentChecks = this.healthCheckHistory.slice(-5);
            const allUnhealthy = recentChecks.every(check => !check.isHealthy);
            if (allUnhealthy && recentChecks.length === 5) {
                this.logger.error('Multiple consecutive health check failures detected', {
                    consecutiveFailures: 5,
                    lastErrors: recentChecks.map(check => check.error)
                });
                // 여기에서 알림 시스템 호출, 회로 차단기 활성화 등을 수행할 수 있음
            }
        }, this.config.healthCheckIntervalMs);
    }
    updateConnectionMetrics(connectionTime, success) {
        if (success) {
            this.metrics.totalConnections++;
            // 이동 평균으로 평균 연결 시간 업데이트
            const alpha = 0.1;
            this.metrics.averageConnectionTime =
                (1 - alpha) * this.metrics.averageConnectionTime + alpha * connectionTime;
        }
        else {
            this.metrics.failedConnections++;
        }
    }
    generateRecommendations() {
        const recommendations = [];
        const successRate = this.metrics.totalRequests > 0
            ? (this.metrics.totalConnections / this.metrics.totalRequests) * 100
            : 100;
        // 성공률이 낮은 경우
        if (successRate < 95) {
            recommendations.push(`Low connection success rate (${successRate.toFixed(1)}%). Consider increasing retry attempts or connection timeout.`);
        }
        // 평균 연결 시간이 긴 경우
        if (this.metrics.averageConnectionTime > 5000) {
            recommendations.push(`High average connection time (${this.metrics.averageConnectionTime.toFixed(0)}ms). Consider optimizing queries or increasing connection pool size.`);
        }
        // 대기 중인 요청이 많은 경우
        if (this.metrics.waitingRequests > this.config.maxConnections * 0.5) {
            recommendations.push(`High number of waiting requests (${this.metrics.waitingRequests}). Consider increasing max connections from ${this.config.maxConnections}.`);
        }
        // 피크 연결 수가 최대값에 근접한 경우
        if (this.metrics.peakConnections > this.config.maxConnections * 0.8) {
            recommendations.push(`Peak connections (${this.metrics.peakConnections}) approaching max limit (${this.config.maxConnections}). Consider increasing pool size.`);
        }
        // 최근 헬스 체크 실패가 있는 경우
        const recentHealthChecks = this.healthCheckHistory.slice(-5);
        const unhealthyCount = recentHealthChecks.filter(check => !check.isHealthy).length;
        if (unhealthyCount > 2) {
            recommendations.push(`Frequent health check failures detected (${unhealthyCount}/5). Check database connectivity and performance.`);
        }
        if (recommendations.length === 0) {
            recommendations.push('Connection pool is operating within optimal parameters.');
        }
        return recommendations;
    }
    initializeMonitoring() {
        if (!this.config.enableMonitoring) {
            return;
        }
        // 주기적으로 메트릭 로깅
        setInterval(() => {
            if (this.isShuttingDown) {
                return;
            }
            this.logger.debug('Connection pool metrics', {
                activeConnections: this.metrics.activeConnections,
                totalRequests: this.metrics.totalRequests,
                failedConnections: this.metrics.failedConnections,
                averageConnectionTime: Math.round(this.metrics.averageConnectionTime),
                waitingRequests: this.metrics.waitingRequests
            });
        }, 60000); // 1분마다 로깅
    }
}
// 연결 풀 팩토리
export class ConnectionPoolFactory {
    static create(supabaseClient, logger, environment = 'production') {
        const configs = {
            development: {
                maxConnections: 5,
                minConnections: 2,
                connectionTimeoutMs: 5000,
                healthCheckIntervalMs: 60000,
                enableMonitoring: true
            },
            staging: {
                maxConnections: 10,
                minConnections: 3,
                connectionTimeoutMs: 8000,
                healthCheckIntervalMs: 30000,
                enableMonitoring: true
            },
            production: {
                maxConnections: 20,
                minConnections: 5,
                connectionTimeoutMs: 10000,
                healthCheckIntervalMs: 30000,
                enableMonitoring: true,
                enableConnectionRetry: true,
                retryAttempts: 3
            }
        };
        return new ConnectionPoolManager(supabaseClient, logger, configs[environment]);
    }
}
//# sourceMappingURL=ConnectionPoolManager.js.map