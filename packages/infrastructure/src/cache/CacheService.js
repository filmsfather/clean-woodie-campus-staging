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
import Redis from 'ioredis';
export class CacheService {
    redis;
    logger;
    stats;
    keyPrefix;
    constructor(config, logger) {
        this.logger = logger;
        this.keyPrefix = config.keyPrefix || 'woodie:';
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            hitRate: 0
        };
        // Redis 클라이언트 설정
        this.redis = new Redis({
            host: config.host || process.env.REDIS_HOST || 'localhost',
            port: config.port || parseInt(process.env.REDIS_PORT || '6379'),
            password: config.password || process.env.REDIS_PASSWORD,
            db: config.db || parseInt(process.env.REDIS_DB || '0'),
            retryDelayOnFailover: config.retryDelayOnFailover || 100,
            lazyConnect: config.lazyConnect ?? true,
            // 연결 실패 시 재시도 설정
            retryConnect: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            // 명령 실행 시간이 긴 경우 로깅
            commandTimeout: 5000,
        });
        // Redis 이벤트 리스너 설정
        this.setupEventListeners();
    }
    /**
     * Redis 연결 상태 확인
     */
    async isConnected() {
        try {
            await this.redis.ping();
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * 캐시에서 값 조회
     */
    async get(key) {
        try {
            const fullKey = this.buildKey(key);
            const data = await this.redis.get(fullKey);
            if (data === null) {
                this.stats.misses++;
                this.updateHitRate();
                return null;
            }
            this.stats.hits++;
            this.updateHitRate();
            return JSON.parse(data);
        }
        catch (error) {
            this.logger.error('Cache get error', { key, error });
            return null;
        }
    }
    /**
     * 캐시에 값 저장
     */
    async set(key, value, ttlSeconds) {
        try {
            const fullKey = this.buildKey(key);
            const data = JSON.stringify(value);
            let result;
            if (ttlSeconds) {
                result = await this.redis.setex(fullKey, ttlSeconds, data);
            }
            else {
                result = await this.redis.set(fullKey, data);
            }
            if (result === 'OK') {
                this.stats.sets++;
                return true;
            }
            return false;
        }
        catch (error) {
            this.logger.error('Cache set error', { key, error });
            return false;
        }
    }
    /**
     * 캐시에서 키 삭제
     */
    async del(key) {
        try {
            const fullKey = this.buildKey(key);
            const result = await this.redis.del(fullKey);
            if (result > 0) {
                this.stats.deletes++;
                return true;
            }
            return false;
        }
        catch (error) {
            this.logger.error('Cache delete error', { key, error });
            return false;
        }
    }
    /**
     * 여러 키 동시 삭제
     */
    async delMany(keys) {
        try {
            if (keys.length === 0)
                return 0;
            const fullKeys = keys.map(key => this.buildKey(key));
            const result = await this.redis.del(...fullKeys);
            this.stats.deletes += result;
            return result;
        }
        catch (error) {
            this.logger.error('Cache delete many error', { keys, error });
            return 0;
        }
    }
    /**
     * 패턴에 매칭되는 모든 키 삭제
     */
    async invalidatePattern(pattern) {
        try {
            const fullPattern = this.buildKey(pattern);
            const keys = await this.redis.keys(fullPattern);
            if (keys.length === 0) {
                return 0;
            }
            const result = await this.redis.del(...keys);
            this.stats.deletes += result;
            this.logger.info('Cache pattern invalidated', {
                pattern,
                keysDeleted: result
            });
            return result;
        }
        catch (error) {
            this.logger.error('Cache invalidate pattern error', { pattern, error });
            return 0;
        }
    }
    /**
     * 키의 TTL 설정
     */
    async expire(key, ttlSeconds) {
        try {
            const fullKey = this.buildKey(key);
            const result = await this.redis.expire(fullKey, ttlSeconds);
            return result === 1;
        }
        catch (error) {
            this.logger.error('Cache expire error', { key, ttlSeconds, error });
            return false;
        }
    }
    /**
     * 키의 남은 TTL 조회
     */
    async ttl(key) {
        try {
            const fullKey = this.buildKey(key);
            return await this.redis.ttl(fullKey);
        }
        catch (error) {
            this.logger.error('Cache TTL error', { key, error });
            return -1;
        }
    }
    /**
     * 키가 존재하는지 확인
     */
    async exists(key) {
        try {
            const fullKey = this.buildKey(key);
            const result = await this.redis.exists(fullKey);
            return result === 1;
        }
        catch (error) {
            this.logger.error('Cache exists error', { key, error });
            return false;
        }
    }
    /**
     * Hash 데이터 저장
     */
    async hset(key, field, value) {
        try {
            const fullKey = this.buildKey(key);
            const data = JSON.stringify(value);
            const result = await this.redis.hset(fullKey, field, data);
            return result >= 0;
        }
        catch (error) {
            this.logger.error('Cache hset error', { key, field, error });
            return false;
        }
    }
    /**
     * Hash 데이터 조회
     */
    async hget(key, field) {
        try {
            const fullKey = this.buildKey(key);
            const data = await this.redis.hget(fullKey, field);
            if (data === null) {
                return null;
            }
            return JSON.parse(data);
        }
        catch (error) {
            this.logger.error('Cache hget error', { key, field, error });
            return null;
        }
    }
    /**
     * 캐시 통계 조회
     */
    getStats() {
        return { ...this.stats };
    }
    /**
     * 캐시 통계 초기화
     */
    resetStats() {
        this.stats.hits = 0;
        this.stats.misses = 0;
        this.stats.sets = 0;
        this.stats.deletes = 0;
        this.stats.hitRate = 0;
    }
    /**
     * Redis 연결 종료
     */
    async disconnect() {
        try {
            await this.redis.quit();
            this.logger.info('Redis connection closed');
        }
        catch (error) {
            this.logger.error('Error closing Redis connection', { error });
        }
    }
    /**
     * 캐시 키 생성 (네임스페이스 포함)
     */
    buildKey(key) {
        return `${this.keyPrefix}${key}`;
    }
    /**
     * 캐시 적중률 업데이트
     */
    updateHitRate() {
        const total = this.stats.hits + this.stats.misses;
        this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
    }
    /**
     * Redis 이벤트 리스너 설정
     */
    setupEventListeners() {
        this.redis.on('connect', () => {
            this.logger.info('Redis connected');
        });
        this.redis.on('ready', () => {
            this.logger.info('Redis ready to receive commands');
        });
        this.redis.on('error', (error) => {
            this.logger.error('Redis error', { error });
        });
        this.redis.on('close', () => {
            this.logger.warn('Redis connection closed');
        });
        this.redis.on('reconnecting', () => {
            this.logger.info('Redis reconnecting');
        });
        this.redis.on('end', () => {
            this.logger.info('Redis connection ended');
        });
    }
}
// 캐시 키 상수 정의
export const CacheKeys = {
    // Student Dashboard
    STUDENT_DASHBOARD: (studentId) => `dashboard:student:${studentId}`,
    TEACHER_DASHBOARD: (teacherId) => `dashboard:teacher:${teacherId}`,
    // SRS System
    SRS_TODAY_REVIEWS: (studentId) => `srs:reviews:today:${studentId}`,
    SRS_OVERDUE_REVIEWS: (studentId) => `srs:reviews:overdue:${studentId}`,
    SRS_STUDENT_STATS: (studentId) => `srs:stats:${studentId}`,
    SRS_PROBLEM_PERFORMANCE: (problemId) => `srs:performance:problem:${problemId}`,
    // Progress Tracking
    STUDENT_STREAK: (studentId) => `progress:streak:${studentId}`,
    STUDENT_ALL_STATS: (studentId) => `progress:stats:all:${studentId}`,
    STUDENT_PROBLEM_SET_STATS: (studentId, problemSetId) => `progress:stats:${studentId}:${problemSetId}`,
    TOP_STREAKS: (limit) => `progress:top_streaks:${limit}`,
    AT_RISK_STUDENTS: () => `progress:at_risk_students`,
    CLASS_PROGRESS: (classId) => `progress:class:${classId}`,
    // Problems
    PROBLEM_DETAIL: (problemId) => `problem:detail:${problemId}`,
    PROBLEM_STATS: (problemId) => `problem:stats:${problemId}`,
    TEACHER_PROBLEMS: (teacherId, filters) => `problems:teacher:${teacherId}${filters ? `:${filters}` : ''}`,
    PROBLEM_SEARCH: (query, filters) => `problems:search:${query}${filters ? `:${filters}` : ''}`,
    PROBLEMS_BY_TAGS: (tags, filters) => `problems:tags:${tags.join(',')}${filters ? `:${filters}` : ''}`,
    POPULAR_PROBLEMS: (limit) => `problems:popular:${limit}`,
    // Aggregated Data
    DAILY_STATS: (date) => `aggregates:daily:${date}`,
    WEEKLY_STATS: (weekStart) => `aggregates:weekly:${weekStart}`,
    PROBLEM_SET_AGGREGATES: (problemSetId) => `aggregates:problem_set:${problemSetId}`,
    SYSTEM_STATS: (date) => `aggregates:system:${date}`,
    // Batch Jobs
    BATCH_JOB_STATUS: (jobId) => `batch:status:${jobId}`,
    BATCH_JOBS_RUNNING: () => `batch:running`,
    BATCH_JOBS_PENDING: () => `batch:pending`,
    // User Sessions
    USER_SESSION: (userId) => `session:user:${userId}`,
    // Notifications
    USER_NOTIFICATIONS: (userId) => `notifications:user:${userId}`,
    NOTIFICATION_SETTINGS: (userId) => `notifications:settings:${userId}`,
    // Generic patterns for invalidation
    DASHBOARD_PATTERN: (userId) => `dashboard:*:${userId}`,
    SRS_PATTERN: (studentId) => `srs:*:${studentId}`,
    PROGRESS_PATTERN: (studentId) => `progress:*:${studentId}`,
    PROBLEM_PATTERN: (problemId) => `problem:*:${problemId}`,
    TEACHER_PATTERN: (teacherId) => `*:teacher:${teacherId}*`,
};
// TTL 상수 정의 (초 단위)
export const CacheTTL = {
    SHORT: 5 * 60, // 5분
    MEDIUM: 15 * 60, // 15분  
    LONG: 30 * 60, // 30분
    EXTRA_LONG: 60 * 60, // 1시간
    DAY: 24 * 60 * 60, // 24시간
    WEEK: 7 * 24 * 60 * 60 // 7일
};
//# sourceMappingURL=CacheService.js.map