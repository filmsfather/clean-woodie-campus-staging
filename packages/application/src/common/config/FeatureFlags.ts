/**
 * 기능 플래그 설정
 * 스테이징/프로덕션 환경에서 기능별 활성화/비활성화 관리
 */

export interface FeatureFlags {
  // 핵심 기능들 (항상 활성화)
  AUTH_SYSTEM: boolean
  PROBLEM_BANK: boolean
  PROGRESS_TRACKING: boolean
  SRS_SYSTEM: boolean

  // 부가 기능들 (환경별 제어 가능)
  GAMIFICATION: boolean
  PERFORMANCE_OPTIMIZATION: boolean
  BATCH_JOBS: boolean
  CACHE_WARMING: boolean
  ANALYTICS: boolean
  NOTIFICATIONS: boolean
  
  // 실험적 기능들
  EXPERIMENTAL_AI_FEATURES: boolean
  BETA_UI_COMPONENTS: boolean
  ADVANCED_SEARCH: boolean
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  // 핵심 기능 - 항상 활성화
  AUTH_SYSTEM: true,
  PROBLEM_BANK: true,
  PROGRESS_TRACKING: true,
  SRS_SYSTEM: true,

  // 부가 기능 - 환경별 설정
  GAMIFICATION: process.env.NODE_ENV === 'production',
  PERFORMANCE_OPTIMIZATION: process.env.NODE_ENV === 'production',
  BATCH_JOBS: process.env.NODE_ENV !== 'development',
  CACHE_WARMING: process.env.NODE_ENV !== 'development',
  ANALYTICS: true,
  NOTIFICATIONS: true,
  
  // 실험적 기능 - 기본적으로 비활성화
  EXPERIMENTAL_AI_FEATURES: false,
  BETA_UI_COMPONENTS: process.env.NODE_ENV === 'development',
  ADVANCED_SEARCH: false,
}

/**
 * 환경별 기능 플래그 오버라이드
 */
export const STAGING_FEATURE_FLAGS: Partial<FeatureFlags> = {
  // 스테이징에서는 안정성 우선
  GAMIFICATION: false,                    // 타입 오류로 인한 임시 비활성화
  PERFORMANCE_OPTIMIZATION: false,       // import 오류로 인한 임시 비활성화
  BATCH_JOBS: false,                     // 복잡한 의존성으로 인한 임시 비활성화
  CACHE_WARMING: false,                  // 의존성 문제로 인한 임시 비활성화
  EXPERIMENTAL_AI_FEATURES: false,
  BETA_UI_COMPONENTS: true,              // 스테이징에서 테스트
  ADVANCED_SEARCH: false,
}

export const PRODUCTION_FEATURE_FLAGS: Partial<FeatureFlags> = {
  // 프로덕션에서는 검증된 기능만
  GAMIFICATION: true,
  PERFORMANCE_OPTIMIZATION: true,
  BATCH_JOBS: true,
  CACHE_WARMING: true,
  EXPERIMENTAL_AI_FEATURES: false,
  BETA_UI_COMPONENTS: false,
  ADVANCED_SEARCH: false,
}

/**
 * 기능 플래그 관리 클래스
 */
export class FeatureFlagManager {
  private flags: FeatureFlags

  constructor() {
    const baseFlags = { ...DEFAULT_FEATURE_FLAGS }
    
    // 환경별 오버라이드 적용
    const environmentFlags = this.getEnvironmentFlags()
    
    this.flags = { ...baseFlags, ...environmentFlags }
  }

  private getEnvironmentFlags(): Partial<FeatureFlags> {
    switch (process.env.NODE_ENV) {
      case 'staging':
        return STAGING_FEATURE_FLAGS
      case 'production':
        return PRODUCTION_FEATURE_FLAGS
      case 'development':
      default:
        return {}
    }
  }

  /**
   * 기능 활성화 여부 확인
   */
  isEnabled(feature: keyof FeatureFlags): boolean {
    return this.flags[feature] ?? false
  }

  /**
   * 여러 기능이 모두 활성화되어 있는지 확인
   */
  areAllEnabled(features: (keyof FeatureFlags)[]): boolean {
    return features.every(feature => this.isEnabled(feature))
  }

  /**
   * 여러 기능 중 하나라도 활성화되어 있는지 확인
   */
  isAnyEnabled(features: (keyof FeatureFlags)[]): boolean {
    return features.some(feature => this.isEnabled(feature))
  }

  /**
   * 현재 활성화된 모든 기능 목록 반환
   */
  getEnabledFeatures(): string[] {
    return Object.entries(this.flags)
      .filter(([_, enabled]) => enabled)
      .map(([feature, _]) => feature)
  }

  /**
   * 기능 플래그 상태 전체 반환 (디버깅용)
   */
  getAllFlags(): FeatureFlags {
    return { ...this.flags }
  }
}

// 싱글톤 인스턴스
export const featureFlags = new FeatureFlagManager()

/**
 * 기능 플래그 데코레이터
 * 클래스나 메서드에 기능 플래그 조건 추가
 */
export function RequireFeature(feature: keyof FeatureFlags) {
  return function(target: any, propertyKey?: string, descriptor?: PropertyDescriptor) {
    if (descriptor) {
      // 메서드 데코레이터
      const originalMethod = descriptor.value
      descriptor.value = function(...args: any[]) {
        if (!featureFlags.isEnabled(feature)) {
          throw new Error(`Feature ${feature} is not enabled`)
        }
        return originalMethod.apply(this, args)
      }
    } else {
      // 클래스 데코레이터
      const originalConstructor = target
      function newConstructor(...args: any[]) {
        if (!featureFlags.isEnabled(feature)) {
          throw new Error(`Feature ${feature} is not enabled`)
        }
        return new originalConstructor(...args)
      }
      newConstructor.prototype = originalConstructor.prototype
      return newConstructor as any
    }
  }
}

/**
 * 조건부 서비스 로더
 */
export class ConditionalServiceLoader {
  /**
   * 기능이 활성화된 경우에만 서비스 로드
   */
  static loadIfEnabled<T>(
    feature: keyof FeatureFlags,
    loader: () => T,
    fallback?: () => T
  ): T | null {
    if (featureFlags.isEnabled(feature)) {
      try {
        return loader()
      } catch (error) {
        console.warn(`Failed to load service for feature ${feature}:`, error)
        return fallback ? fallback() : null
      }
    }
    return fallback ? fallback() : null
  }

  /**
   * 비동기 서비스 로더
   */
  static async loadIfEnabledAsync<T>(
    feature: keyof FeatureFlags,
    loader: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T | null> {
    if (featureFlags.isEnabled(feature)) {
      try {
        return await loader()
      } catch (error) {
        console.warn(`Failed to load async service for feature ${feature}:`, error)
        return fallback ? await fallback() : null
      }
    }
    return fallback ? await fallback() : null
  }
}

/**
 * 기능 가용성 체크 헬퍼
 * 동적 import 없이 단순히 기능 활성화 상태만 확인
 */
export const FeatureAvailability = {
  isGamificationEnabled(): boolean {
    return featureFlags.isEnabled('GAMIFICATION')
  },

  isPerformanceOptimizationEnabled(): boolean {
    return featureFlags.isEnabled('PERFORMANCE_OPTIMIZATION')
  },

  isBatchJobsEnabled(): boolean {
    return featureFlags.isEnabled('BATCH_JOBS')
  },

  isCacheWarmingEnabled(): boolean {
    return featureFlags.isEnabled('CACHE_WARMING')
  },

  isAnalyticsEnabled(): boolean {
    return featureFlags.isEnabled('ANALYTICS')
  },

  areNotificationsEnabled(): boolean {
    return featureFlags.isEnabled('NOTIFICATIONS')
  }
}