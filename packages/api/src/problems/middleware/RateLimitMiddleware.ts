import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { RateLimitConfig, ApiErrorResponse, HTTP_STATUS } from '../interfaces/ProblemApiTypes';
import { ProblemBankErrorCode } from '@woodie/application/problems/errors/ProblemBankErrors';
import * as crypto from 'crypto';

// Rate Limiting 미들웨어
export class RateLimitMiddleware {
  
  // 표준 제한 (일반적인 조회 작업)
  static standardLimit() {
    return this.createRateLimit({
      windowMs: 15 * 60 * 1000, // 15분
      maxRequests: 100,         // 15분간 100회
      message: 'Too many requests from this user. Please try again in 15 minutes.'
    });
  }

  // 생성 작업 제한 (더 엄격)
  static createLimit() {
    return this.createRateLimit({
      windowMs: 5 * 60 * 1000,  // 5분
      maxRequests: 10,          // 5분간 10회
      message: 'Too many problem creation requests. Please try again in 5 minutes.'
    });
  }

  // 업데이트 작업 제한
  static updateLimit() {
    return this.createRateLimit({
      windowMs: 5 * 60 * 1000,  // 5분
      maxRequests: 50,          // 5분간 50회
      message: 'Too many update requests. Please try again in 5 minutes.'
    });
  }

  // 삭제 작업 제한 (매우 엄격)
  static deleteLimit() {
    return this.createRateLimit({
      windowMs: 10 * 60 * 1000, // 10분
      maxRequests: 20,          // 10분간 20회
      message: 'Too many delete requests. Please try again in 10 minutes.'
    });
  }

  // 검색 작업 제한
  static searchLimit() {
    return this.createRateLimit({
      windowMs: 1 * 60 * 1000,  // 1분
      maxRequests: 30,          // 1분간 30회
      message: 'Too many search requests. Please try again in 1 minute.',
      skipSuccessfulRequests: false,
      skipFailedRequests: true
    });
  }

  // 분석/통계 작업 제한 (캐시 때문에 덜 엄격)
  static analyticsLimit() {
    return this.createRateLimit({
      windowMs: 5 * 60 * 1000,  // 5분
      maxRequests: 20,          // 5분간 20회
      message: 'Too many analytics requests. Please try again in 5 minutes.'
    });
  }

  // AI 기반 작업 제한 (태그 추천 등, 비용이 많이 드는 작업)
  static aiLimit() {
    return this.createRateLimit({
      windowMs: 10 * 60 * 1000, // 10분
      maxRequests: 30,          // 10분간 30회
      message: 'Too many AI-powered requests. Please try again in 10 minutes.'
    });
  }

  // 일괄 작업 제한 (서버 리소스 보호)
  static bulkLimit() {
    return this.createRateLimit({
      windowMs: 30 * 60 * 1000, // 30분
      maxRequests: 10,          // 30분간 10회
      message: 'Too many bulk operation requests. Please try again in 30 minutes.'
    });
  }

  // 자동완성 제한 (매우 빈번한 요청)
  static autocompleteLimit() {
    return this.createRateLimit({
      windowMs: 1 * 60 * 1000,  // 1분
      maxRequests: 60,          // 1분간 60회 (타이핑에 대응)
      message: 'Too many autocomplete requests. Please slow down.'
    });
  }

  // 내보내기/가져오기 제한 (리소스 집약적)
  static exportLimit() {
    return this.createRateLimit({
      windowMs: 60 * 60 * 1000, // 1시간
      maxRequests: 5,           // 1시간에 5회
      message: 'Too many export requests. Please try again in 1 hour.'
    });
  }

  static importLimit() {
    return this.createRateLimit({
      windowMs: 60 * 60 * 1000, // 1시간
      maxRequests: 3,           // 1시간에 3회
      message: 'Too many import requests. Please try again in 1 hour.'
    });
  }

  // 관리자 작업 제한 (덜 엄격)
  static adminLimit() {
    return this.createRateLimit({
      windowMs: 15 * 60 * 1000, // 15분
      maxRequests: 200,         // 15분간 200회
      message: 'Too many admin requests. Please try again in 15 minutes.'
    });
  }

  // === 특별한 제한 정책들 ===

  // 사용자별 제한 (IP + 사용자 ID 조합)
  static perUserLimit(config: Partial<RateLimitConfig> = {}) {
    return this.createRateLimit({
      windowMs: 15 * 60 * 1000,
      maxRequests: 100,
      ...config,
      keyGenerator: (req: Request): string => {
        const user = (req as any).user;
        const ip = req.ip || req.connection.remoteAddress || 'unknown';
        return user ? `${user.id}:${ip}` : ip;
      }
    });
  }

  // 교사별 제한 (교사당 할당량)
  static perTeacherLimit(config: Partial<RateLimitConfig> = {}) {
    return this.createRateLimit({
      windowMs: 60 * 60 * 1000, // 1시간
      maxRequests: 1000,        // 교사당 시간당 1000회
      ...config,
      keyGenerator: (req: Request): string => {
        const user = (req as any).user;
        return user?.teacherId || req.ip || 'anonymous';
      }
    });
  }

  // 동적 제한 (사용자 역할에 따라)
  static dynamicLimit() {
    return (req: Request, res: Response, next: any) => {
      const user = (req as any).user;
      
      if (!user) {
        // 인증되지 않은 사용자는 매우 제한적
        return this.createRateLimit({
          windowMs: 15 * 60 * 1000,
          maxRequests: 10,
          message: 'Please authenticate to increase rate limits.'
        })(req, res, next);
      }

      if (user.role === 'admin') {
        // 관리자는 더 관대한 제한
        return this.createRateLimit({
          windowMs: 15 * 60 * 1000,
          maxRequests: 500,
          message: 'Admin rate limit exceeded.'
        })(req, res, next);
      }

      // 일반 교사는 표준 제한
      return this.standardLimit()(req, res, next);
    };
  }

  // === Private 헬퍼 메서드들 ===

  private static createRateLimit(config: RateLimitConfig & { keyGenerator?: (req: Request) => string }) {
    const {
      windowMs,
      maxRequests,
      message,
      skipSuccessfulRequests = false,
      skipFailedRequests = false,
      keyGenerator
    } = config;

    return rateLimit({
      windowMs,
      max: maxRequests,
      message: this.createErrorMessage(message || 'Rate limit exceeded'),
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false,  // Disable the `X-RateLimit-*` headers
      
      // 사용자별 키 생성
      keyGenerator: keyGenerator || ((req: Request): string => {
        const user = (req as any).user;
        return user?.id || req.ip || 'anonymous';
      }),

      // 성공적인 요청 건너뛰기 설정
      skip: (req: Request, res: Response): boolean => {
        if (skipSuccessfulRequests && res.statusCode < 400) {
          return true;
        }
        if (skipFailedRequests && res.statusCode >= 400) {
          return true;
        }
        return false;
      },

      // 사용자 정의 에러 핸들러
      handler: (req: Request, res: Response) => {
        const errorResponse: ApiErrorResponse = {
          success: false,
          error: {
            code: ProblemBankErrorCode.TIMEOUT_ERROR,
            message: message || 'Rate limit exceeded',
            details: {
              retryAfter: Math.round(windowMs / 1000), // seconds
              limit: maxRequests,
              windowMs
            }
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID(),
            version: '1.0.0'
          }
        };

        res.status(HTTP_STATUS.TOO_MANY_REQUESTS)
           .set('Retry-After', String(Math.round(windowMs / 1000)))
           .json(errorResponse);
      }
    });
  }

  private static createErrorMessage(message: string): any {
    // express-rate-limit은 문자열 또는 함수를 받음
    return {
      error: {
        code: ProblemBankErrorCode.TIMEOUT_ERROR,
        message,
        timestamp: new Date().toISOString()
      }
    };
  }

  // === 유틸리티 메서드들 ===

  // 제한 상태 확인
  static getQuotaInfo(req: Request): {
    limit: number;
    remaining: number;
    resetTime: Date;
  } | null {
    const rateLimitHeaders = {
      limit: req.get('RateLimit-Limit'),
      remaining: req.get('RateLimit-Remaining'),
      reset: req.get('RateLimit-Reset')
    };

    if (!rateLimitHeaders.limit) return null;

    return {
      limit: parseInt(rateLimitHeaders.limit),
      remaining: parseInt(rateLimitHeaders.remaining || '0'),
      resetTime: new Date(parseInt(rateLimitHeaders.reset || '0') * 1000)
    };
  }

  // 제한 상태를 응답 헤더에 추가
  static addQuotaHeaders() {
    return (req: Request, res: Response, next: any) => {
      const quota = this.getQuotaInfo(req);
      if (quota) {
        res.set({
          'X-Quota-Limit': quota.limit.toString(),
          'X-Quota-Remaining': quota.remaining.toString(),
          'X-Quota-Reset': Math.round(quota.resetTime.getTime() / 1000).toString()
        });
      }
      next();
    };
  }

  // 특정 사용자의 제한 해제 (응급 상황용)
  static createBypassToken(userId: string, duration: number = 3600): string {
    const token = crypto.randomBytes(32).toString('hex');
    // 실제 구현에서는 Redis나 메모리 캐시에 저장
    console.log(`Bypass token for user ${userId}: ${token} (valid for ${duration} seconds)`);
    return token;
  }
}

// HTTP 상태 코드 추가 (429 Too Many Requests)
declare module '../interfaces/ProblemApiTypes' {
  interface HTTP_STATUS {
    TOO_MANY_REQUESTS: 429;
  }
}