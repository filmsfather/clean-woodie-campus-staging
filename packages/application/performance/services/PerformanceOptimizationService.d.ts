import { ICacheService } from '../../infrastructure/interfaces/ICacheService';
import { IPerformanceMonitor } from '../../infrastructure/interfaces/IPerformanceMonitor';
import { IAssetManager } from '../../infrastructure/interfaces/IAssetManager';
import { Result } from '@woodie/domain/common/Result';
/**
 * 성능 최적화 추천사항
 */
export interface PerformanceRecommendation {
    type: 'cache' | 'database' | 'cdn' | 'memory' | 'concurrency';
    priority: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    impact: string;
    implementation: string;
    estimatedImprovement: string;
}
/**
 * 최적화 실행 결과
 */
export interface OptimizationResult {
    executed: string[];
    skipped: string[];
    failed: string[];
    improvements: {
        responseTimeReduction?: number;
        memoryReduction?: number;
        cacheHitRateIncrease?: number;
    };
    executionTimeMs: number;
}
/**
 * 성능 최적화 서비스 (개선된 버전)
 * 의존성 역전, 동시성 안전성, 레이트 리밋이 적용된 아키텍처
 */
export declare class PerformanceOptimizationService {
    private readonly cacheService;
    private readonly performanceMonitor;
    private readonly assetManager;
    private readonly asyncLock;
    private readonly concurrencyLimiter;
    private readonly rateLimiter;
    private readonly thresholds;
    private readonly rateLimit;
    constructor(cacheService: ICacheService, performanceMonitor: IPerformanceMonitor, assetManager: IAssetManager);
    /**
     * 성능 분석 및 최적화 추천사항 생성
     */
    analyzePerformance(): Promise<Result<PerformanceRecommendation[]>>;
    /**
     * 자동 최적화 실행 (레이트 리밋 적용)
     */
    executeOptimizations(recommendations: PerformanceRecommendation[]): Promise<Result<OptimizationResult>>;
    /**
     * 개별 최적화 실행
     */
    private executeOptimization;
    /**
     * 캐시 최적화
     */
    private optimizeCache;
    /**
     * 메모리 최적화
     */
    private optimizeMemory;
    /**
     * CDN 최적화
     */
    private optimizeCDN;
    /**
     * 데이터베이스 최적화 (모의 구현)
     */
    private optimizeDatabase;
    /**
     * 최적화 서비스 상태 조회
     */
    getOptimizationStatus(): {
        isRunning: boolean;
        activeJobs: number;
        queueLength: number;
        rateLimitStatus: {
            tokensRemaining: number;
            timeUntilReset: number;
        };
    };
}
//# sourceMappingURL=PerformanceOptimizationService.d.ts.map