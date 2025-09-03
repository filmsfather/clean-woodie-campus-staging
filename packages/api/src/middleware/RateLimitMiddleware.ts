import { Request, Response, NextFunction } from 'express'

// 간단한 인메모리 레이트 리미터 (프로덕션에서는 Redis 사용 권장)
interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

/**
 * 레이트 리미트 미들웨어 팩토리
 * @param windowSeconds 시간 창 (초)
 * @param maxRequests 최대 요청 수
 * @returns Express 미들웨어 함수
 */
export const rateLimitMiddleware = (windowSeconds: number, maxRequests: number) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // 클라이언트 식별자 생성 (IP + User-Agent 조합)
      const clientId = `${req.ip}-${req.get('User-Agent') || 'unknown'}`
      const currentTime = Date.now()
      const windowMs = windowSeconds * 1000

      // 기존 엔트리 조회 또는 새로 생성
      let entry = rateLimitStore.get(clientId)
      
      if (!entry || currentTime >= entry.resetTime) {
        // 새로운 시간 창 시작
        entry = {
          count: 1,
          resetTime: currentTime + windowMs
        }
        rateLimitStore.set(clientId, entry)
      } else {
        // 기존 시간 창 내에서 요청 수 증가
        entry.count++
      }

      // 응답 헤더 설정
      res.setHeader('X-RateLimit-Limit', maxRequests.toString())
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - entry.count).toString())
      res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000).toString())

      // 제한 초과 검사
      if (entry.count > maxRequests) {
        res.status(429).json({
          success: false,
          error: {
            message: 'Too many requests',
            type: 'RateLimitExceeded',
            details: {
              limit: maxRequests,
              window: windowSeconds,
              retryAfter: Math.ceil((entry.resetTime - currentTime) / 1000)
            }
          },
          timestamp: new Date().toISOString()
        })
        return
      }

      // 주기적으로 만료된 엔트리 정리 (간단한 가비지 컬렉션)
      if (Math.random() < 0.01) { // 1% 확률로 정리
        cleanupExpiredEntries()
      }

      next()

    } catch (error) {
      console.error('Rate limit middleware error:', error)
      // 에러 발생 시 요청을 통과시킴 (fail-open)
      next()
    }
  }
}

/**
 * 만료된 레이트 리미트 엔트리 정리
 */
function cleanupExpiredEntries(): void {
  const currentTime = Date.now()
  const expiredKeys: string[] = []

  for (const [key, entry] of rateLimitStore.entries()) {
    if (currentTime >= entry.resetTime) {
      expiredKeys.push(key)
    }
  }

  for (const key of expiredKeys) {
    rateLimitStore.delete(key)
  }

  if (expiredKeys.length > 0) {
    console.log(`Cleaned up ${expiredKeys.length} expired rate limit entries`)
  }
}

/**
 * 특정 클라이언트의 레이트 리미트 리셋 (관리자용)
 */
export function resetRateLimit(clientId: string): boolean {
  return rateLimitStore.delete(clientId)
}

/**
 * 레이트 리미트 통계 조회 (모니터링용)
 */
export function getRateLimitStats(): {
  activeClients: number
  totalEntries: number
  memoryUsage: string
} {
  return {
    activeClients: rateLimitStore.size,
    totalEntries: rateLimitStore.size,
    memoryUsage: `${Math.round(JSON.stringify(Array.from(rateLimitStore.entries())).length / 1024)}KB`
  }
}