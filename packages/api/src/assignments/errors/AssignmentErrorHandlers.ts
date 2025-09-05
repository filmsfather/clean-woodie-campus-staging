import { Request, Response, NextFunction } from 'express';
import { AssignmentApiError } from './AssignmentApiErrors';
import { ApiResponse } from '../interfaces';

export class AssignmentErrorHandler {
  public static handle(
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    console.error('Assignment API Error:', {
      error: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      userId: (req as any).user?.id,
      timestamp: new Date().toISOString()
    });

    if (error instanceof AssignmentApiError) {
      AssignmentErrorHandler.handleAssignmentApiError(error, res);
      return;
    }

    // Domain layer 에러 처리
    if (error.message.includes('not found')) {
      AssignmentErrorHandler.handleNotFoundError(error, res);
      return;
    }

    if (error.message.includes('Access denied') || error.message.includes('Unauthorized')) {
      AssignmentErrorHandler.handleAccessDeniedError(error, res);
      return;
    }

    if (error.message.includes('validation') || error.message.includes('invalid')) {
      AssignmentErrorHandler.handleValidationError(error, res);
      return;
    }

    // 기본 서버 에러 처리
    AssignmentErrorHandler.handleInternalServerError(error, res);
  }

  private static handleAssignmentApiError(
    error: AssignmentApiError,
    res: Response
  ): void {
    const response: ApiResponse = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      },
      timestamp: new Date().toISOString()
    };

    res.status(error.statusCode).json(response);
  }

  private static handleNotFoundError(error: Error, res: Response): void {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'RESOURCE_NOT_FOUND',
        message: error.message
      },
      timestamp: new Date().toISOString()
    };

    res.status(404).json(response);
  }

  private static handleAccessDeniedError(error: Error, res: Response): void {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'ACCESS_DENIED',
        message: error.message
      },
      timestamp: new Date().toISOString()
    };

    res.status(403).json(response);
  }

  private static handleValidationError(error: Error, res: Response): void {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message
      },
      timestamp: new Date().toISOString()
    };

    res.status(422).json(response);
  }

  private static handleInternalServerError(error: Error, res: Response): void {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred'
      },
      timestamp: new Date().toISOString()
    };

    res.status(500).json(response);
  }
}

export const assignmentErrorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  AssignmentErrorHandler.handle(error, req, res, next);
};

// 도메인 에러를 API 에러로 변환하는 유틸리티
export class DomainErrorMapper {
  public static mapToApiError(domainError: string): AssignmentApiError {
    if (domainError.includes('Assignment not found')) {
      const assignmentId = DomainErrorMapper.extractIdFromError(domainError);
      return new (require('./AssignmentApiErrors').AssignmentNotFoundError)(assignmentId);
    }

    if (domainError.includes('Access denied')) {
      return new (require('./AssignmentApiErrors').AssignmentAccessDeniedError)('unknown', 'unknown');
    }

    if (domainError.includes('Due date')) {
      return new (require('./AssignmentApiErrors').DueDateInPastError)(new Date());
    }

    if (domainError.includes('No targets')) {
      return new (require('./AssignmentApiErrors').NoTargetsProvidedError)();
    }

    if (domainError.includes('Invalid state')) {
      return new (require('./AssignmentApiErrors').InvalidAssignmentStateError)('unknown', 'unknown');
    }

    // 기본 에러
    return new AssignmentApiError(domainError, 'DOMAIN_ERROR', 400);
  }

  private static extractIdFromError(errorMessage: string): string {
    const match = errorMessage.match(/ID '([^']+)'/);
    return match ? match[1] : 'unknown';
  }
}

// 비동기 라우트 핸들러를 위한 래퍼
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
};

// 특정 에러 타입에 대한 커스텀 핸들러들
export const handleDomainError = (error: string): never => {
  throw DomainErrorMapper.mapToApiError(error);
};

export const handleRepositoryError = (error: Error, operation: string): never => {
  console.error(`Repository error during ${operation}:`, error);
  
  if (error.message.includes('connection') || error.message.includes('timeout')) {
    throw new (require('./AssignmentApiErrors').ServiceUnavailableError)('Database', error.message);
  }
  
  throw new AssignmentApiError(
    `Database operation failed: ${operation}`,
    'REPOSITORY_ERROR',
    500,
    { operation, originalError: error.message }
  );
};