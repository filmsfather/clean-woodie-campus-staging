import { Request, Response, NextFunction } from 'express';
import { ApiErrorResponse, AuthenticatedRequest, RequestContext, HTTP_STATUS } from '../interfaces/ProblemApiTypes';
import { ProblemBankErrorCode } from '@woodie/application/problems/errors/ProblemBankErrors';
import * as crypto from 'crypto';

// JWT 토큰 검증을 위한 인터페이스
interface JwtPayload {
  sub: string;        // user ID
  email: string;
  role: string;
  teacherId?: string;
  exp: number;
  iat: number;
}

// 인증 미들웨어
export class AuthMiddleware {
  
  // JWT 토큰 검증 및 사용자 정보 추출
  static authenticate() {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const token = this.extractToken(req);
        
        if (!token) {
          this.sendUnauthorizedResponse(res, 'Authentication token is required');
          return;
        }

        // JWT 토큰 검증 (실제 구현에서는 JWT 라이브러리 사용)
        const payload = await this.verifyToken(token);
        
        if (!payload) {
          this.sendUnauthorizedResponse(res, 'Invalid or expired token');
          return;
        }

        // 요청 객체에 사용자 정보 추가
        (req as AuthenticatedRequest).user = {
          id: payload.sub,
          email: payload.email,
          role: payload.role as 'teacher' | 'admin',
          teacherId: payload.teacherId || payload.sub
        };

        // 요청 컨텍스트 생성
        const context: RequestContext = {
          requestId: crypto.randomUUID(),
          correlationId: req.headers['x-correlation-id'] as string || crypto.randomUUID(),
          userId: payload.sub,
          teacherId: payload.teacherId || payload.sub,
          userRole: payload.role,
          timestamp: new Date()
        };

        req.requestContext = context;

        next();
        
      } catch (error) {
        console.error('Authentication error:', error);
        this.sendUnauthorizedResponse(res, 'Authentication failed');
      }
    };
  }

  // 교사 역할 권한 확인
  static requireTeacher() {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      const user = req.user;
      
      if (!user) {
        this.sendUnauthorizedResponse(res, 'Authentication required');
        return;
      }

      if (user.role !== 'teacher' && user.role !== 'admin') {
        this.sendForbiddenResponse(res, 'Teacher role required');
        return;
      }

      next();
    };
  }

  // 관리자 역할 권한 확인
  static requireAdmin() {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      const user = req.user;
      
      if (!user) {
        this.sendUnauthorizedResponse(res, 'Authentication required');
        return;
      }

      if (user.role !== 'admin') {
        this.sendForbiddenResponse(res, 'Administrator role required');
        return;
      }

      next();
    };
  }

  // 문제 소유권 확인 (URL 파라미터에서 problemId 추출)
  static requireProblemOwnership() {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        const user = req.user;
        const problemId = req.params.id;
        
        if (!user) {
          this.sendUnauthorizedResponse(res, 'Authentication required');
          return;
        }

        if (!problemId) {
          this.sendBadRequestResponse(res, 'Problem ID is required');
          return;
        }

        // 관리자는 모든 문제에 접근 가능
        if (user.role === 'admin') {
          next();
          return;
        }

        // 문제 소유권 확인 (실제 구현에서는 Repository 사용)
        const isOwner = await this.checkProblemOwnership(problemId, user.teacherId!);
        
        if (!isOwner) {
          this.sendForbiddenResponse(res, 'Access denied: You do not own this problem');
          return;
        }

        next();
        
      } catch (error) {
        console.error('Ownership check error:', error);
        this.sendInternalErrorResponse(res, 'Failed to verify problem ownership');
      }
    };
  }

  // 일괄 작업 권한 확인
  static requireBulkOperationPermission() {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        const user = req.user;
        const { problemIds } = req.body;
        
        if (!user) {
          this.sendUnauthorizedResponse(res, 'Authentication required');
          return;
        }

        if (!problemIds || !Array.isArray(problemIds) || problemIds.length === 0) {
          this.sendBadRequestResponse(res, 'Problem IDs array is required');
          return;
        }

        // 관리자는 모든 문제에 접근 가능
        if (user.role === 'admin') {
          next();
          return;
        }

        // 일괄 소유권 확인
        const ownershipResults = await this.checkBulkOwnership(problemIds, user.teacherId!);
        const unauthorizedProblems = ownershipResults
          .filter(result => !result.isOwner)
          .map(result => result.problemId);

        if (unauthorizedProblems.length > 0) {
          this.sendForbiddenResponse(res, 
            `Access denied to problems: ${unauthorizedProblems.join(', ')}`
          );
          return;
        }

        next();
        
      } catch (error) {
        console.error('Bulk permission check error:', error);
        this.sendInternalErrorResponse(res, 'Failed to verify bulk operation permissions');
      }
    };
  }

  // === Private 헬퍼 메서드들 ===

  private static extractToken(req: Request): string | null {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) return null;
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
    
    return parts[1];
  }

  private static async verifyToken(token: string): Promise<JwtPayload | null> {
    try {
      // 실제 구현에서는 JWT 라이브러리(jsonwebtoken 등)를 사용
      // 여기서는 간단한 구현으로 대체
      
      // Base64 디코딩 (실제로는 서명 검증 필요)
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64url').toString('utf-8')
      );
      
      // 만료 시간 확인
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return null;
      }
      
      return payload as JwtPayload;
      
    } catch (error) {
      console.error('Token verification error:', error);
      return null;
    }
  }

  private static async checkProblemOwnership(
    problemId: string,
    teacherId: string
  ): Promise<boolean> {
    // 실제 구현에서는 Repository를 통해 DB 조회
    // 여기서는 간단한 mock 구현
    try {
      // TODO: IProblemRepository.verifyOwnership 사용
      return true; // Mock implementation
    } catch (error) {
      console.error('Problem ownership check failed:', error);
      return false;
    }
  }

  private static async checkBulkOwnership(
    problemIds: string[],
    teacherId: string
  ): Promise<Array<{ problemId: string; isOwner: boolean }>> {
    // 실제 구현에서는 Repository를 통해 일괄 조회
    try {
      // TODO: IProblemRepository.bulkVerifyOwnership 사용
      return problemIds.map(id => ({ problemId: id, isOwner: true })); // Mock
    } catch (error) {
      console.error('Bulk ownership check failed:', error);
      return problemIds.map(id => ({ problemId: id, isOwner: false }));
    }
  }

  // === 응답 헬퍼 메서드들 ===

  private static sendUnauthorizedResponse(res: Response, message: string): void {
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code: ProblemBankErrorCode.UNAUTHORIZED_ACCESS,
        message
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
        version: '1.0.0'
      }
    };

    res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse);
  }

  private static sendForbiddenResponse(res: Response, message: string): void {
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code: ProblemBankErrorCode.INSUFFICIENT_PERMISSIONS,
        message
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
        version: '1.0.0'
      }
    };

    res.status(HTTP_STATUS.FORBIDDEN).json(errorResponse);
  }

  private static sendBadRequestResponse(res: Response, message: string): void {
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code: ProblemBankErrorCode.INVALID_SEARCH_FILTER,
        message
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
        version: '1.0.0'
      }
    };

    res.status(HTTP_STATUS.BAD_REQUEST).json(errorResponse);
  }

  private static sendInternalErrorResponse(res: Response, message: string): void {
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code: ProblemBankErrorCode.UNEXPECTED_ERROR,
        message
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
        version: '1.0.0'
      }
    };

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
}

// Request 인터페이스 확장
declare global {
  namespace Express {
    interface Request {
      requestContext?: RequestContext;
    }
  }
}