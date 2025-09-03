/**
 * 레이트 리미터
 * 동시 실행 제한 및 요청 빈도 제어
 */
export interface RateLimitResult {
    allowed: boolean;
    remainingTokens?: number;
    resetTime?: Date;
    retryAfter?: number;
}
/**
 * 토큰 버킷 기반 레이트 리미터
 */
export declare class TokenBucketRateLimiter {
    private tokens;
    private lastRefill;
    private readonly capacity;
    private readonly refillRate;
    private readonly refillInterval;
    constructor(capacity: number, refillRate: number);
    /**
     * 토큰 소비 시도
     */
    consume(tokens?: number): RateLimitResult;
    /**
     * 토큰 리필
     */
    private refill;
    /**
     * 현재 토큰 수
     */
    getAvailableTokens(): number;
    /**
     * 다음 토큰까지 남은 시간 (ms)
     */
    getTimeUntilNextToken(): number;
}
/**
 * 슬라이딩 윈도우 레이트 리미터
 */
export declare class SlidingWindowRateLimiter {
    private requests;
    private readonly windowSizeMs;
    private readonly maxRequests;
    constructor(maxRequests: number, windowSizeMs: number);
    /**
     * 요청 허용 여부 확인
     */
    isAllowed(): RateLimitResult;
    /**
     * 현재 윈도우 내 요청 수
     */
    getCurrentCount(): number;
    /**
     * 요청 기록 초기화
     */
    reset(): void;
}
/**
 * 동시 실행 제한기
 */
export declare class ConcurrencyLimiter {
    private running;
    private readonly maxConcurrency;
    private readonly queue;
    constructor(maxConcurrency: number);
    /**
     * 함수를 동시 실행 제한 하에서 실행
     */
    execute<T>(fn: () => Promise<T>): Promise<T>;
    /**
     * 현재 실행 중인 작업 수
     */
    getRunningCount(): number;
    /**
     * 대기 중인 작업 수
     */
    getQueueLength(): number;
    /**
     * 실행 가능 여부 확인
     */
    canExecute(): boolean;
}
//# sourceMappingURL=RateLimiter.d.ts.map