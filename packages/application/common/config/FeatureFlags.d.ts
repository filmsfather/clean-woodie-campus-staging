/**
 * 기능 플래그 설정
 * 스테이징/프로덕션 환경에서 기능별 활성화/비활성화 관리
 */
export interface FeatureFlags {
    AUTH_SYSTEM: boolean;
    PROBLEM_BANK: boolean;
    PROGRESS_TRACKING: boolean;
    SRS_SYSTEM: boolean;
    GAMIFICATION: boolean;
    PERFORMANCE_OPTIMIZATION: boolean;
    BATCH_JOBS: boolean;
    CACHE_WARMING: boolean;
    ANALYTICS: boolean;
    NOTIFICATIONS: boolean;
    EXPERIMENTAL_AI_FEATURES: boolean;
    BETA_UI_COMPONENTS: boolean;
    ADVANCED_SEARCH: boolean;
}
export declare const DEFAULT_FEATURE_FLAGS: FeatureFlags;
/**
 * 환경별 기능 플래그 오버라이드
 */
export declare const STAGING_FEATURE_FLAGS: Partial<FeatureFlags>;
export declare const PRODUCTION_FEATURE_FLAGS: Partial<FeatureFlags>;
/**
 * 기능 플래그 관리 클래스
 */
export declare class FeatureFlagManager {
    private flags;
    constructor();
    private getEnvironmentFlags;
    /**
     * 기능 활성화 여부 확인
     */
    isEnabled(feature: keyof FeatureFlags): boolean;
    /**
     * 여러 기능이 모두 활성화되어 있는지 확인
     */
    areAllEnabled(features: (keyof FeatureFlags)[]): boolean;
    /**
     * 여러 기능 중 하나라도 활성화되어 있는지 확인
     */
    isAnyEnabled(features: (keyof FeatureFlags)[]): boolean;
    /**
     * 현재 활성화된 모든 기능 목록 반환
     */
    getEnabledFeatures(): string[];
    /**
     * 기능 플래그 상태 전체 반환 (디버깅용)
     */
    getAllFlags(): FeatureFlags;
}
export declare const featureFlags: FeatureFlagManager;
/**
 * 기능 플래그 데코레이터
 * 클래스나 메서드에 기능 플래그 조건 추가
 */
export declare function RequireFeature(feature: keyof FeatureFlags): (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => any;
/**
 * 조건부 서비스 로더
 */
export declare class ConditionalServiceLoader {
    /**
     * 기능이 활성화된 경우에만 서비스 로드
     */
    static loadIfEnabled<T>(feature: keyof FeatureFlags, loader: () => T, fallback?: () => T): T | null;
    /**
     * 비동기 서비스 로더
     */
    static loadIfEnabledAsync<T>(feature: keyof FeatureFlags, loader: () => Promise<T>, fallback?: () => Promise<T>): Promise<T | null>;
}
/**
 * 기능 가용성 체크 헬퍼
 * 동적 import 없이 단순히 기능 활성화 상태만 확인
 */
export declare const FeatureAvailability: {
    isGamificationEnabled(): boolean;
    isPerformanceOptimizationEnabled(): boolean;
    isBatchJobsEnabled(): boolean;
    isCacheWarmingEnabled(): boolean;
    isAnalyticsEnabled(): boolean;
    areNotificationsEnabled(): boolean;
};
//# sourceMappingURL=FeatureFlags.d.ts.map