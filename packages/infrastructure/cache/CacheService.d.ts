/**
 * Redis 기반 캐싱 서비스
 *
 * 기능:
 * - Redis 연결 관리
 * - 키-값 캐싱 (get/set/delete)
 * - TTL(Time To Live) 관리
 * - 패턴 기반 캐시 무효화
 * - 캐시 통계 수집
 */
import { ICacheService, CacheOptions, CacheStats } from '@woodie/application/infrastructure/interfaces/ICacheService';
export interface ILogger {
    info(message: string, meta?: any): void;
    error(message: string, meta?: any): void;
    warn(message: string, meta?: any): void;
    debug(message: string, meta?: any): void;
}
export interface CacheConfig {
    host?: string;
    port?: number;
    password?: string;
    db?: number;
    keyPrefix?: string;
    lazyConnect?: boolean;
}
export declare class CacheService implements ICacheService {
    private readonly redis;
    private readonly logger;
    private readonly stats;
    private readonly keyPrefix;
    constructor(config: CacheConfig, logger: ILogger);
    /**
     * Redis 연결 상태 확인 (내부 유틸리티 메서드)
     */
    private isConnected;
    /**
     * 캐시에서 값 조회
     */
    get<T>(key: string): Promise<T | null>;
    /**
     * 캐시에 값 저장
     */
    set<T>(key: string, value: T, optionsOrTtl?: CacheOptions | number): Promise<boolean>;
    /**
     * 캐시에서 키 삭제
     */
    del(key: string): Promise<boolean>;
    /**
     * 여러 키 동시 삭제
     */
    delMany(keys: string[]): Promise<number>;
    /**
     * 패턴에 매칭되는 모든 키 삭제
     */
    invalidatePattern(pattern: string): Promise<number>;
    /**
     * 키의 TTL 설정
     */
    expire(key: string, ttlSeconds: number): Promise<boolean>;
    /**
     * 키의 남은 TTL 조회
     */
    ttl(key: string): Promise<number>;
    /**
     * 키가 존재하는지 확인
     */
    exists(key: string): Promise<boolean>;
    /**
     * 캐시 통계 조회
     */
    getStats(): CacheStats;
    /**
     * 캐시 통계 초기화
     */
    resetStats(): void;
    /**
     * Redis 연결 종료
     */
    disconnect(): Promise<void>;
    /**
     * 캐시 키 생성 (네임스페이스 포함)
     */
    private buildKey;
    /**
     * 캐시 적중률 업데이트
     */
    private updateHitRate;
    /**
     * Redis 이벤트 리스너 설정
     */
    private setupEventListeners;
}
export declare const CacheKeys: {
    readonly STUDENT_DASHBOARD: (studentId: string) => string;
    readonly TEACHER_DASHBOARD: (teacherId: string) => string;
    readonly SRS_TODAY_REVIEWS: (studentId: string) => string;
    readonly SRS_OVERDUE_REVIEWS: (studentId: string) => string;
    readonly SRS_STUDENT_STATS: (studentId: string) => string;
    readonly SRS_PROBLEM_PERFORMANCE: (problemId: string) => string;
    readonly STUDENT_STREAK: (studentId: string) => string;
    readonly STUDENT_ALL_STATS: (studentId: string) => string;
    readonly STUDENT_STATS: (studentId: string, period: string) => string;
    readonly STUDENT_PROBLEM_SET_STATS: (studentId: string, problemSetId: string) => string;
    readonly TOP_STREAKS: (limit: number) => string;
    readonly AT_RISK_STUDENTS: () => string;
    readonly CLASS_PROGRESS: (classId: string) => string;
    readonly PROBLEM_DETAIL: (problemId: string) => string;
    readonly PROBLEM_STATS: (problemId: string) => string;
    readonly TEACHER_PROBLEMS: (teacherId: string, filters?: string) => string;
    readonly PROBLEM_SEARCH: (query: string, filters?: string) => string;
    readonly PROBLEMS_BY_TAGS: (tags: string[], filters?: string) => string;
    readonly POPULAR_PROBLEMS: (limit: number) => string;
    readonly DAILY_STATS: (date: string) => string;
    readonly WEEKLY_STATS: (weekStart: string) => string;
    readonly PROBLEM_SET_AGGREGATES: (problemSetId: string) => string;
    readonly SYSTEM_STATS: (date: string) => string;
    readonly BATCH_JOB_STATUS: (jobId: string) => string;
    readonly BATCH_JOBS_RUNNING: () => string;
    readonly BATCH_JOBS_PENDING: () => string;
    readonly USER_SESSION: (userId: string) => string;
    readonly USER_NOTIFICATIONS: (userId: string) => string;
    readonly NOTIFICATION_SETTINGS: (userId: string) => string;
    readonly DASHBOARD_PATTERN: (userId: string) => string;
    readonly SRS_PATTERN: (studentId: string) => string;
    readonly PROGRESS_PATTERN: (studentId: string) => string;
    readonly PROBLEM_PATTERN: (problemId: string) => string;
    readonly TEACHER_PATTERN: (teacherId: string) => string;
};
export declare const CacheTTL: {
    readonly SHORT: number;
    readonly MEDIUM: number;
    readonly LONG: number;
    readonly EXTRA_LONG: number;
    readonly DAY: number;
    readonly WEEK: number;
};
//# sourceMappingURL=CacheService.d.ts.map