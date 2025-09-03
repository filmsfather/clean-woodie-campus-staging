/**
 * 레이트 리미터
 * 동시 실행 제한 및 요청 빈도 제어
 */

export interface RateLimitResult {
  allowed: boolean
  remainingTokens?: number
  resetTime?: Date
  retryAfter?: number
}

/**
 * 토큰 버킷 기반 레이트 리미터
 */
export class TokenBucketRateLimiter {
  private tokens: number
  private lastRefill: number
  private readonly capacity: number
  private readonly refillRate: number // tokens per second
  private readonly refillInterval: number

  constructor(capacity: number, refillRate: number) {
    this.capacity = capacity
    this.refillRate = refillRate
    this.refillInterval = 1000 / refillRate // ms per token
    this.tokens = capacity
    this.lastRefill = Date.now()
  }

  /**
   * 토큰 소비 시도
   */
  consume(tokens: number = 1): RateLimitResult {
    this.refill()

    if (this.tokens >= tokens) {
      this.tokens -= tokens
      return {
        allowed: true,
        remainingTokens: this.tokens
      }
    }

    const tokensNeeded = tokens - this.tokens
    const waitTime = tokensNeeded * this.refillInterval

    return {
      allowed: false,
      remainingTokens: this.tokens,
      retryAfter: Math.ceil(waitTime / 1000), // seconds
      resetTime: new Date(Date.now() + waitTime)
    }
  }

  /**
   * 토큰 리필
   */
  private refill(): void {
    const now = Date.now()
    const timePassed = now - this.lastRefill
    const tokensToAdd = Math.floor(timePassed / this.refillInterval)

    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd)
      this.lastRefill = now
    }
  }

  /**
   * 현재 토큰 수
   */
  getAvailableTokens(): number {
    this.refill()
    return this.tokens
  }

  /**
   * 다음 토큰까지 남은 시간 (ms)
   */
  getTimeUntilNextToken(): number {
    if (this.tokens >= this.capacity) {
      return 0
    }
    
    const timeSinceLastRefill = Date.now() - this.lastRefill
    return Math.max(0, this.refillInterval - timeSinceLastRefill)
  }
}

/**
 * 슬라이딩 윈도우 레이트 리미터
 */
export class SlidingWindowRateLimiter {
  private requests: number[] = []
  private readonly windowSizeMs: number
  private readonly maxRequests: number

  constructor(maxRequests: number, windowSizeMs: number) {
    this.maxRequests = maxRequests
    this.windowSizeMs = windowSizeMs
  }

  /**
   * 요청 허용 여부 확인
   */
  isAllowed(): RateLimitResult {
    const now = Date.now()
    const windowStart = now - this.windowSizeMs

    // 윈도우 밖의 오래된 요청들 제거
    this.requests = this.requests.filter(timestamp => timestamp > windowStart)

    if (this.requests.length < this.maxRequests) {
      this.requests.push(now)
      return {
        allowed: true,
        remainingTokens: this.maxRequests - this.requests.length
      }
    }

    // 가장 오래된 요청이 윈도우 밖으로 나갈 때까지의 시간
    const oldestRequest = Math.min(...this.requests)
    const retryAfter = Math.ceil((oldestRequest + this.windowSizeMs - now) / 1000)

    return {
      allowed: false,
      remainingTokens: 0,
      retryAfter,
      resetTime: new Date(oldestRequest + this.windowSizeMs)
    }
  }

  /**
   * 현재 윈도우 내 요청 수
   */
  getCurrentCount(): number {
    const now = Date.now()
    const windowStart = now - this.windowSizeMs
    return this.requests.filter(timestamp => timestamp > windowStart).length
  }

  /**
   * 요청 기록 초기화
   */
  reset(): void {
    this.requests = []
  }
}

/**
 * 동시 실행 제한기
 */
export class ConcurrencyLimiter {
  private running = 0
  private readonly maxConcurrency: number
  private readonly queue: (() => void)[] = []

  constructor(maxConcurrency: number) {
    this.maxConcurrency = maxConcurrency
  }

  /**
   * 함수를 동시 실행 제한 하에서 실행
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const execute = async () => {
        this.running++
        
        try {
          const result = await fn()
          resolve(result)
        } catch (error) {
          reject(error)
        } finally {
          this.running--
          
          // 대기 중인 작업이 있으면 실행
          const next = this.queue.shift()
          if (next) {
            next()
          }
        }
      }

      if (this.running < this.maxConcurrency) {
        execute()
      } else {
        this.queue.push(execute)
      }
    })
  }

  /**
   * 현재 실행 중인 작업 수
   */
  getRunningCount(): number {
    return this.running
  }

  /**
   * 대기 중인 작업 수
   */
  getQueueLength(): number {
    return this.queue.length
  }

  /**
   * 실행 가능 여부 확인
   */
  canExecute(): boolean {
    return this.running < this.maxConcurrency
  }
}