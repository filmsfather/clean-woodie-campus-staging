/**
 * 성능 최적화 관련 설정값들
 * 하드코딩 제거를 위한 설정 파일
 */
export interface PerformanceThresholds {
    responseTime: {
        warningMs: number;
        criticalMs: number;
        slowQueryMs: number;
    };
    errorRate: {
        warningPercent: number;
        criticalPercent: number;
    };
    memoryUsage: {
        warningMB: number;
        criticalMB: number;
        warningPercent: number;
        criticalPercent: number;
    };
    throughput: {
        minRequestsPerSecond: number;
    };
    cache: {
        minHitRatePercent: number;
        maxSizeMB: number;
    };
}
export interface CacheSettings {
    ttl: {
        short: number;
        medium: number;
        long: number;
        extraLong: number;
        day: number;
        week: number;
    };
    warming: {
        enabled: boolean;
        scheduleHour: number;
        strategies: {
            popularProblems: boolean;
            topStreaks: boolean;
            systemStats: boolean;
            recentAggregates: boolean;
        };
    };
    maxMemoryMB: number;
    evictionPolicy: 'lru' | 'lfu' | 'fifo';
}
export interface CDNSettings {
    baseUrl: string;
    regions: string[];
    cacheHeaders: {
        images: string;
        scripts: string;
        styles: string;
        fonts: string;
    };
    imageOptimization: {
        enabled: boolean;
        formats: ('webp' | 'avif' | 'jpeg' | 'png')[];
        qualities: number[];
        sizes: number[];
    };
    assetCleanup: {
        olderThanDays: number;
        minAccessCount: number;
    };
}
export interface RateLimitSettings {
    optimization: {
        maxConcurrentJobs: number;
        cooldownMinutes: number;
    };
    cache: {
        maxRequestsPerMinute: number;
        maxPatternInvalidationsPerMinute: number;
    };
    monitoring: {
        maxMetricsPerMinute: number;
        dataRetentionHours: number;
    };
}
export declare const DEFAULT_PERFORMANCE_THRESHOLDS: PerformanceThresholds;
export declare const DEFAULT_CACHE_SETTINGS: CacheSettings;
export declare const DEFAULT_CDN_SETTINGS: CDNSettings;
export declare const DEFAULT_RATE_LIMIT_SETTINGS: RateLimitSettings;
/**
 * 환경별 설정 로더
 */
export declare class PerformanceConfigLoader {
    static load(): {
        thresholds: PerformanceThresholds;
        cache: CacheSettings;
        cdn: CDNSettings;
        rateLimit: RateLimitSettings;
    };
}
//# sourceMappingURL=PerformanceConfig.d.ts.map