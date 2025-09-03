// 캐시 서비스 인터페이스

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Cache tags for invalidation
  compress?: boolean; // Compress large values
  serialize?: boolean; // Auto serialize/deserialize objects
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
  hitRate: number;
}

export interface ICacheService {
  // 기본 캐시 작업
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, options?: CacheOptions): Promise<void>;
  delete(key: string): Promise<boolean>;
  exists(key: string): Promise<boolean>;
  clear(): Promise<void>;
  
  // 다중 작업
  mget<T>(keys: string[]): Promise<Array<T | null>>;
  mset<T>(entries: Array<{ key: string; value: T; options?: CacheOptions }>): Promise<void>;
  mdelete(keys: string[]): Promise<number>;
  
  // 패턴 기반 작업
  keys(pattern: string): Promise<string[]>;
  deleteByPattern(pattern: string): Promise<number>;
  
  // 태그 기반 무효화
  invalidateByTags(tags: string[]): Promise<number>;
  
  // TTL 관리
  expire(key: string, ttl: number): Promise<boolean>;
  ttl(key: string): Promise<number>;
  
  // 통계
  stats(): Promise<CacheStats>;
  
  // 원자적 작업
  increment(key: string, delta?: number): Promise<number>;
  decrement(key: string, delta?: number): Promise<number>;
  
  // 분산 락 (선택적)
  lock?(key: string, ttl: number): Promise<boolean>;
  unlock?(key: string): Promise<boolean>;
}

// 캐시 키 빌더 유틸리티
export class CacheKeyBuilder {
  private static readonly SEPARATOR = ':';
  
  static forProblem(problemId: string): string {
    return `problem${this.SEPARATOR}${problemId}`;
  }
  
  static forTeacherProblems(teacherId: string): string {
    return `teacher_problems${this.SEPARATOR}${teacherId}`;
  }
  
  static forTeacherStatistics(teacherId: string): string {
    return `teacher_stats${this.SEPARATOR}${teacherId}`;
  }
  
  static forTagAnalytics(teacherId: string): string {
    return `tag_analytics${this.SEPARATOR}${teacherId}`;
  }
  
  static forDifficultyAnalysis(teacherId: string): string {
    return `difficulty_analysis${this.SEPARATOR}${teacherId}`;
  }
  
  static forSearchResult(hash: string): string {
    return `search${this.SEPARATOR}${hash}`;
  }
  
  static forTagRecommendation(contentHash: string): string {
    return `tag_recommend${this.SEPARATOR}${contentHash}`;
  }
  
  static forBulkPermission(teacherId: string, problemIdsHash: string): string {
    return `bulk_permission${this.SEPARATOR}${teacherId}${this.SEPARATOR}${problemIdsHash}`;
  }
  
  // 패턴 생성
  static teacherPattern(teacherId: string): string {
    return `*${this.SEPARATOR}${teacherId}*`;
  }
  
  static problemPattern(problemId: string): string {
    return `*${this.SEPARATOR}${problemId}*`;
  }
}

// 캐시 태그 상수
export class CacheTags {
  static readonly TEACHER_DATA = 'teacher_data';
  static readonly PROBLEM_DATA = 'problem_data';
  static readonly STATISTICS = 'statistics';
  static readonly ANALYTICS = 'analytics';
  static readonly SEARCH_RESULTS = 'search_results';
  static readonly RECOMMENDATIONS = 'recommendations';
  
  static forTeacher(teacherId: string): string {
    return `teacher_${teacherId}`;
  }
  
  static forProblem(problemId: string): string {
    return `problem_${problemId}`;
  }
}

// 캐시 전략 설정
export class CacheStrategies {
  // 짧은 캐시 (검색 결과 등)
  static readonly SHORT_TTL = 300; // 5분
  
  // 중간 캐시 (통계, 분석 데이터)
  static readonly MEDIUM_TTL = 1800; // 30분
  
  // 긴 캐시 (문제 메타데이터 등)
  static readonly LONG_TTL = 3600; // 1시간
  
  // 매우 긴 캐시 (불변 데이터)
  static readonly VERY_LONG_TTL = 86400; // 24시간
  
  static getStatisticsOptions(): CacheOptions {
    return {
      ttl: this.MEDIUM_TTL,
      tags: [CacheTags.STATISTICS, CacheTags.ANALYTICS],
      compress: true,
      serialize: true
    };
  }
  
  static getSearchOptions(): CacheOptions {
    return {
      ttl: this.SHORT_TTL,
      tags: [CacheTags.SEARCH_RESULTS],
      compress: true,
      serialize: true
    };
  }
  
  static getProblemOptions(): CacheOptions {
    return {
      ttl: this.LONG_TTL,
      tags: [CacheTags.PROBLEM_DATA],
      serialize: true
    };
  }
  
  static getRecommendationOptions(): CacheOptions {
    return {
      ttl: this.MEDIUM_TTL,
      tags: [CacheTags.RECOMMENDATIONS],
      serialize: true
    };
  }
}