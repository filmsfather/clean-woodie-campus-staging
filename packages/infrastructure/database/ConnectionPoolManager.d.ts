import { SupabaseClient } from '@supabase/supabase-js';
import { ILogger } from '@woodie/application/common/interfaces/ILogger';
import { Result } from '@woodie/domain/common/Result';
export interface ConnectionPoolConfig {
    maxConnections: number;
    minConnections: number;
    connectionTimeoutMs: number;
    idleTimeoutMs: number;
    maxLifetimeMs: number;
    healthCheckIntervalMs: number;
    enableMonitoring: boolean;
    enableConnectionRetry: boolean;
    retryAttempts: number;
    retryDelayMs: number;
}
export interface ConnectionMetrics {
    totalConnections: number;
    activeConnections: number;
    idleConnections: number;
    waitingRequests: number;
    totalRequests: number;
    failedConnections: number;
    averageConnectionTime: number;
    peakConnections: number;
    connectionErrors: number;
}
export interface HealthCheckResult {
    isHealthy: boolean;
    responseTimeMs: number;
    error?: string;
    timestamp: Date;
}
export declare class ConnectionPoolManager {
    private readonly supabase;
    private readonly logger;
    private readonly config;
    private readonly metrics;
    private readonly healthCheckHistory;
    private healthCheckTimer?;
    private isShuttingDown;
    constructor(supabaseClient: SupabaseClient, logger: ILogger, config?: Partial<ConnectionPoolConfig>);
    initialize(): Promise<Result<void>>;
    acquireConnection<T>(operation: (client: SupabaseClient) => Promise<T>, timeoutMs?: number): Promise<Result<T>>;
    executeTransaction<T>(operations: Array<(client: SupabaseClient) => Promise<any>>, isolationLevel?: 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE'): Promise<Result<T[]>>;
    getPoolStatus(): Promise<{
        config: ConnectionPoolConfig;
        metrics: ConnectionMetrics;
        healthStatus: HealthCheckResult[];
        recommendations: string[];
    }>;
    resetMetrics(): void;
    shutdown(): Promise<void>;
    private executeWithConnection;
    private performHealthCheck;
    private startHealthCheckMonitoring;
    private updateConnectionMetrics;
    private generateRecommendations;
    private initializeMonitoring;
}
export declare class ConnectionPoolFactory {
    static create(supabaseClient: SupabaseClient, logger: ILogger, environment?: 'development' | 'staging' | 'production'): ConnectionPoolManager;
}
//# sourceMappingURL=ConnectionPoolManager.d.ts.map