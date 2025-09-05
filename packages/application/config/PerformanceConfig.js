/**
 * 성능 최적화 관련 설정값들
 * 하드코딩 제거를 위한 설정 파일
 */
// 기본 설정값들
export const DEFAULT_PERFORMANCE_THRESHOLDS = {
    responseTime: {
        warningMs: 1000,
        criticalMs: 3000,
        slowQueryMs: 2000
    },
    errorRate: {
        warningPercent: 5,
        criticalPercent: 10
    },
    memoryUsage: {
        warningMB: 1024, // 1GB
        criticalMB: 2048, // 2GB
        warningPercent: 80,
        criticalPercent: 90
    },
    throughput: {
        minRequestsPerSecond: 10
    },
    cache: {
        minHitRatePercent: 70,
        maxSizeMB: 512
    }
};
export const DEFAULT_CACHE_SETTINGS = {
    ttl: {
        short: 5 * 60, // 5분
        medium: 15 * 60, // 15분  
        long: 30 * 60, // 30분
        extraLong: 60 * 60, // 1시간
        day: 24 * 60 * 60, // 24시간
        week: 7 * 24 * 60 * 60 // 7일
    },
    warming: {
        enabled: true,
        scheduleHour: 2, // 새벽 2시
        strategies: {
            popularProblems: true,
            topStreaks: true,
            systemStats: true,
            recentAggregates: true
        }
    },
    maxMemoryMB: 512,
    evictionPolicy: 'lru'
};
export const DEFAULT_CDN_SETTINGS = {
    baseUrl: process.env.CDN_BASE_URL || 'https://cdn.woodiecampus.com',
    regions: ['ap-northeast-2', 'us-east-1', 'eu-west-1'],
    cacheHeaders: {
        images: 'public, max-age=31536000, immutable',
        scripts: 'public, max-age=31536000, immutable',
        styles: 'public, max-age=31536000, immutable',
        fonts: 'public, max-age=31536000, immutable'
    },
    imageOptimization: {
        enabled: true,
        formats: ['webp', 'avif', 'jpeg'],
        qualities: [80, 90],
        sizes: [320, 640, 1024, 1920]
    },
    assetCleanup: {
        olderThanDays: 90,
        minAccessCount: 10
    }
};
export const DEFAULT_RATE_LIMIT_SETTINGS = {
    optimization: {
        maxConcurrentJobs: 3,
        cooldownMinutes: 5
    },
    cache: {
        maxRequestsPerMinute: 1000,
        maxPatternInvalidationsPerMinute: 100
    },
    monitoring: {
        maxMetricsPerMinute: 10000,
        dataRetentionHours: 24
    }
};
/**
 * 환경별 설정 로더
 */
export class PerformanceConfigLoader {
    static load() {
        const env = process.env.NODE_ENV || 'development';
        // 환경별 설정 오버라이드 가능
        const config = {
            thresholds: { ...DEFAULT_PERFORMANCE_THRESHOLDS },
            cache: { ...DEFAULT_CACHE_SETTINGS },
            cdn: { ...DEFAULT_CDN_SETTINGS },
            rateLimit: { ...DEFAULT_RATE_LIMIT_SETTINGS }
        };
        // 프로덕션 환경에서는 더 엄격한 임계값 적용
        if (env === 'production') {
            config.thresholds.responseTime.warningMs = 500;
            config.thresholds.responseTime.criticalMs = 1500;
            config.thresholds.errorRate.warningPercent = 2;
            config.thresholds.errorRate.criticalPercent = 5;
        }
        // 개발 환경에서는 느슨한 설정
        if (env === 'development') {
            config.thresholds.responseTime.warningMs = 2000;
            config.thresholds.responseTime.criticalMs = 5000;
            config.cache.warming.enabled = false;
        }
        return config;
    }
}
//# sourceMappingURL=PerformanceConfig.js.map