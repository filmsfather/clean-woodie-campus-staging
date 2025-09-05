/**
 * 레이트 리미터
 * 동시 실행 제한 및 요청 빈도 제어
 */
/**
 * 토큰 버킷 기반 레이트 리미터
 */
export class TokenBucketRateLimiter {
    tokens;
    lastRefill;
    capacity;
    refillRate; // tokens per second
    refillInterval;
    constructor(capacity, refillRate) {
        this.capacity = capacity;
        this.refillRate = refillRate;
        this.refillInterval = 1000 / refillRate; // ms per token
        this.tokens = capacity;
        this.lastRefill = Date.now();
    }
    /**
     * 토큰 소비 시도
     */
    consume(tokens = 1) {
        this.refill();
        if (this.tokens >= tokens) {
            this.tokens -= tokens;
            return {
                allowed: true,
                remainingTokens: this.tokens
            };
        }
        const tokensNeeded = tokens - this.tokens;
        const waitTime = tokensNeeded * this.refillInterval;
        return {
            allowed: false,
            remainingTokens: this.tokens,
            retryAfter: Math.ceil(waitTime / 1000), // seconds
            resetTime: new Date(Date.now() + waitTime)
        };
    }
    /**
     * 토큰 리필
     */
    refill() {
        const now = Date.now();
        const timePassed = now - this.lastRefill;
        const tokensToAdd = Math.floor(timePassed / this.refillInterval);
        if (tokensToAdd > 0) {
            this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
            this.lastRefill = now;
        }
    }
    /**
     * 현재 토큰 수
     */
    getAvailableTokens() {
        this.refill();
        return this.tokens;
    }
    /**
     * 다음 토큰까지 남은 시간 (ms)
     */
    getTimeUntilNextToken() {
        if (this.tokens >= this.capacity) {
            return 0;
        }
        const timeSinceLastRefill = Date.now() - this.lastRefill;
        return Math.max(0, this.refillInterval - timeSinceLastRefill);
    }
}
/**
 * 슬라이딩 윈도우 레이트 리미터
 */
export class SlidingWindowRateLimiter {
    requests = [];
    windowSizeMs;
    maxRequests;
    constructor(maxRequests, windowSizeMs) {
        this.maxRequests = maxRequests;
        this.windowSizeMs = windowSizeMs;
    }
    /**
     * 요청 허용 여부 확인
     */
    isAllowed() {
        const now = Date.now();
        const windowStart = now - this.windowSizeMs;
        // 윈도우 밖의 오래된 요청들 제거
        this.requests = this.requests.filter(timestamp => timestamp > windowStart);
        if (this.requests.length < this.maxRequests) {
            this.requests.push(now);
            return {
                allowed: true,
                remainingTokens: this.maxRequests - this.requests.length
            };
        }
        // 가장 오래된 요청이 윈도우 밖으로 나갈 때까지의 시간
        const oldestRequest = Math.min(...this.requests);
        const retryAfter = Math.ceil((oldestRequest + this.windowSizeMs - now) / 1000);
        return {
            allowed: false,
            remainingTokens: 0,
            retryAfter,
            resetTime: new Date(oldestRequest + this.windowSizeMs)
        };
    }
    /**
     * 현재 윈도우 내 요청 수
     */
    getCurrentCount() {
        const now = Date.now();
        const windowStart = now - this.windowSizeMs;
        return this.requests.filter(timestamp => timestamp > windowStart).length;
    }
    /**
     * 요청 기록 초기화
     */
    reset() {
        this.requests = [];
    }
}
/**
 * 동시 실행 제한기
 */
export class ConcurrencyLimiter {
    running = 0;
    maxConcurrency;
    queue = [];
    constructor(maxConcurrency) {
        this.maxConcurrency = maxConcurrency;
    }
    /**
     * 함수를 동시 실행 제한 하에서 실행
     */
    async execute(fn) {
        return new Promise((resolve, reject) => {
            const execute = async () => {
                this.running++;
                try {
                    const result = await fn();
                    resolve(result);
                }
                catch (error) {
                    reject(error);
                }
                finally {
                    this.running--;
                    // 대기 중인 작업이 있으면 실행
                    const next = this.queue.shift();
                    if (next) {
                        next();
                    }
                }
            };
            if (this.running < this.maxConcurrency) {
                execute();
            }
            else {
                this.queue.push(execute);
            }
        });
    }
    /**
     * 현재 실행 중인 작업 수
     */
    getRunningCount() {
        return this.running;
    }
    /**
     * 대기 중인 작업 수
     */
    getQueueLength() {
        return this.queue.length;
    }
    /**
     * 실행 가능 여부 확인
     */
    canExecute() {
        return this.running < this.maxConcurrency;
    }
}
//# sourceMappingURL=RateLimiter.js.map