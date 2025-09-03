import { Request, Response, NextFunction } from 'express';
import { ApiErrorResponse, HTTP_STATUS } from '../interfaces/ProblemApiTypes';
import { ProblemBankError, ProblemBankErrorCode } from '@woodie/application/problems/errors/ProblemBankErrors';
import * as crypto from 'crypto';

// 에러 핸들링 미들웨어
export class ErrorHandlerMiddleware {
  
  // 메인 에러 핸들러
  static handle() {
    return (error: any, req: Request, res: Response, next: NextFunction): void => {
      // 이미 응답이 전송된 경우 Express 기본 에러 핸들러에게 위임
      if (res.headersSent) {
        return next(error);
      }

      const requestId = (req as any).requestContext?.requestId || crypto.randomUUID();
      
      // 에러 로깅
      console.error('Error occurred:', {
        error: error.message,
        stack: error.stack,
        requestId,
        method: req.method,
        url: req.url,
        user: (req as any).user?.id,
        timestamp: new Date().toISOString()
      });

      // ProblemBankError 처리
      if (error instanceof ProblemBankError) {
        this.handleProblemBankError(error, res, requestId);
        return;
      }

      // Validation Error 처리
      if (error.name === 'ValidationError') {
        this.handleValidationError(error, res, requestId);
        return;
      }

      // JWT Error 처리
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        this.handleJwtError(error, res, requestId);
        return;
      }

      // Multer Error 처리 (파일 업로드)
      if (error.name === 'MulterError') {
        this.handleMulterError(error, res, requestId);
        return;
      }

      // Database Error 처리
      if (this.isDatabaseError(error)) {
        this.handleDatabaseError(error, res, requestId);
        return;
      }

      // Syntax Error 처리 (잘못된 JSON 등)
      if (error instanceof SyntaxError && 'body' in error) {
        this.handleSyntaxError(error, res, requestId);
        return;
      }

      // 기본 에러 처리
      this.handleGenericError(error, res, requestId);
    };
  }

  // 404 Not Found 핸들러
  static handleNotFound() {
    return (req: Request, res: Response): void => {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: ProblemBankErrorCode.PROBLEM_NOT_FOUND,
          message: `Route ${req.method} ${req.path} not found`,
          details: {
            method: req.method,
            path: req.path,
            availableRoutes: [
              'GET /api/problems',
              'POST /api/problems',
              'GET /api/problems/search',
              'GET /api/problems/analytics',
              'GET /api/problems/tags',
              'POST /api/problems/bulk'
            ]
          }
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
          version: '1.0.0'
        }
      };

      res.status(HTTP_STATUS.NOT_FOUND).json(errorResponse);
    };
  }

  // Method Not Allowed 핸들러
  static handleMethodNotAllowed() {
    return (req: Request, res: Response): void => {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: `Method ${req.method} is not allowed for this route`,
          details: {
            method: req.method,
            path: req.path
          }
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
          version: '1.0.0'
        }
      };

      res.status(HTTP_STATUS.METHOD_NOT_ALLOWED).json(errorResponse);
    };
  }

  // === Private 에러 핸들러들 ===

  private static handleProblemBankError(
    error: ProblemBankError,
    res: Response,
    requestId: string
  ): void {
    const statusCode = error.toHttpStatus();
    
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code: error.code,
        message: error.toUserMessage(),
        details: process.env.NODE_ENV === 'development' ? {
          originalMessage: error.message,
          context: error.context,
          stack: error.stack
        } : undefined
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
        version: '1.0.0'
      }
    };

    res.status(statusCode).json(errorResponse);
  }

  private static handleValidationError(
    error: any,
    res: Response,
    requestId: string
  ): void {
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code: ProblemBankErrorCode.BULK_VALIDATION_FAILED,
        message: 'Request validation failed',
        details: {
          validationErrors: error.details || error.errors || [error.message]
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
        version: '1.0.0'
      }
    };

    res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json(errorResponse);
  }

  private static handleJwtError(
    error: any,
    res: Response,
    requestId: string
  ): void {
    const isExpired = error.name === 'TokenExpiredError';
    
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code: ProblemBankErrorCode.UNAUTHORIZED_ACCESS,
        message: isExpired ? 'Token has expired' : 'Invalid token',
        details: process.env.NODE_ENV === 'development' ? {
          jwtError: error.message,
          expiredAt: error.expiredAt
        } : undefined
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
        version: '1.0.0'
      }
    };

    res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse);
  }

  private static handleMulterError(
    error: any,
    res: Response,
    requestId: string
  ): void {
    const errorMessages: { [key: string]: string } = {
      'LIMIT_FILE_SIZE': 'File size too large',
      'LIMIT_FILE_COUNT': 'Too many files',
      'LIMIT_FIELD_KEY': 'Field name too long',
      'LIMIT_FIELD_VALUE': 'Field value too long',
      'LIMIT_FIELD_COUNT': 'Too many fields',
      'LIMIT_UNEXPECTED_FILE': 'Unexpected file field'
    };

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code: 'FILE_UPLOAD_ERROR',
        message: errorMessages[error.code] || 'File upload failed',
        details: {
          multerCode: error.code,
          field: error.field
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
        version: '1.0.0'
      }
    };

    res.status(HTTP_STATUS.BAD_REQUEST).json(errorResponse);
  }

  private static handleDatabaseError(
    error: any,
    res: Response,
    requestId: string
  ): void {
    // 데이터베이스 에러에서 민감한 정보 제거
    const sanitizedMessage = this.sanitizeDatabaseError(error.message);

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code: ProblemBankErrorCode.DATABASE_ERROR,
        message: 'Database operation failed',
        details: process.env.NODE_ENV === 'development' ? {
          dbError: sanitizedMessage,
          constraint: error.constraint,
          table: error.table
        } : undefined
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
        version: '1.0.0'
      }
    };

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }

  private static handleSyntaxError(
    error: any,
    res: Response,
    requestId: string
  ): void {
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code: ProblemBankErrorCode.INVALID_SEARCH_FILTER,
        message: 'Invalid JSON format in request body',
        details: process.env.NODE_ENV === 'development' ? {
          syntaxError: error.message,
          position: error.body
        } : undefined
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
        version: '1.0.0'
      }
    };

    res.status(HTTP_STATUS.BAD_REQUEST).json(errorResponse);
  }

  private static handleGenericError(
    error: any,
    res: Response,
    requestId: string
  ): void {
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code: ProblemBankErrorCode.UNEXPECTED_ERROR,
        message: 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? {
          error: error.message,
          stack: error.stack
        } : undefined
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
        version: '1.0.0'
      }
    };

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }

  // === 유틸리티 메서드들 ===

  private static isDatabaseError(error: any): boolean {
    // PostgreSQL, MySQL, MongoDB 등 데이터베이스 에러 감지
    const dbErrorNames = [
      'SequelizeError',
      'MongoError',
      'PostgresError',
      'MySQLError',
      'DatabaseError'
    ];

    return dbErrorNames.some(name => error.name.includes(name)) ||
           error.code && (
             error.code.startsWith('23') || // Integrity constraint violation
             error.code.startsWith('42') || // Syntax error or access rule violation  
             error.code === 'ECONNREFUSED' || // Connection refused
             error.code === 'ETIMEDOUT'    // Connection timeout
           );
  }

  private static sanitizeDatabaseError(message: string): string {
    // 민감한 정보 제거 (테이블명, 컬럼명 등은 유지)
    return message
      .replace(/password[^\s]*/gi, '[REDACTED]')
      .replace(/secret[^\s]*/gi, '[REDACTED]')
      .replace(/token[^\s]*/gi, '[REDACTED]')
      .replace(/key[^\s]*/gi, '[REDACTED]');
  }

  // 에러 알림 시스템 (선택적)
  private static notifyError(error: any, req: Request, requestId: string): void {
    // 심각한 에러의 경우 알림 시스템에 전송
    if (this.isCriticalError(error)) {
      // 실제 구현에서는 Slack, Discord, 이메일 등으로 알림
      console.error('CRITICAL ERROR DETECTED:', {
        error: error.message,
        requestId,
        user: (req as any).user?.id,
        timestamp: new Date().toISOString()
      });
    }
  }

  private static isCriticalError(error: any): boolean {
    // 데이터베이스 연결 실패, 메모리 부족 등 심각한 에러
    const criticalPatterns = [
      'ECONNREFUSED',
      'ENOMEM',
      'ENOSPC',
      'Maximum call stack size exceeded'
    ];

    return criticalPatterns.some(pattern => 
      error.message.includes(pattern) || error.code === pattern
    );
  }
}