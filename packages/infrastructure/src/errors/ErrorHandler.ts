import { 
  ProblemBankError, 
  ProblemBankErrorCode, 
  ProblemBankErrorFactory 
} from '@woodie/application/problems/errors/ProblemBankErrors';
import { ILogger } from '@woodie/application/common/interfaces/ILogger';
import { Result } from '@woodie/domain/common/Result';

export interface ErrorHandlerConfig {
  logger: ILogger;
  environment?: 'development' | 'production' | 'test';
  enableStackTrace?: boolean;
  enableDetailedErrors?: boolean;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    userMessage: string;
    timestamp: string;
    correlationId?: string;
    details?: any;
    stack?: string;
  };
}

export interface ErrorContext {
  correlationId?: string;
  userId?: string;
  operation?: string;
  requestId?: string;
  additionalContext?: Record<string, any>;
}

export class ErrorHandler {
  private readonly logger: ILogger;
  private readonly config: ErrorHandlerConfig;

  constructor(config: ErrorHandlerConfig) {
    this.logger = config.logger;
    this.config = {
      environment: 'production',
      enableStackTrace: false,
      enableDetailedErrors: false,
      ...config
    };
  }

  /**
   * 에러를 처리하고 표준화된 응답 형태로 변환
   */
  handleError(error: unknown, context?: ErrorContext): ErrorResponse {
    const problemBankError = this.normalizeToProblemBankError(error);
    
    // 로깅
    this.logError(problemBankError, context);
    
    // 응답 생성
    return this.createErrorResponse(problemBankError, context);
  }

  /**
   * Result 타입으로 에러 처리
   */
  handleErrorAsResult<T>(error: unknown, context?: ErrorContext): Result<T> {
    const problemBankError = this.normalizeToProblemBankError(error);
    this.logError(problemBankError, context);
    return Result.fail(problemBankError.message);
  }

  /**
   * 비동기 함수를 래핑하여 에러 처리
   */
  wrapAsync<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    operation: string
  ): T {
    return (async (...args: any[]) => {
      try {
        return await fn(...args);
      } catch (error) {
        const context: ErrorContext = { operation };
        throw this.normalizeToProblemBankError(error, context);
      }
    }) as T;
  }

  /**
   * 동기 함수를 래핑하여 에러 처리
   */
  wrapSync<T extends (...args: any[]) => any>(
    fn: T,
    operation: string
  ): T {
    return ((...args: any[]) => {
      try {
        return fn(...args);
      } catch (error) {
        const context: ErrorContext = { operation };
        throw this.normalizeToProblemBankError(error, context);
      }
    }) as T;
  }

  /**
   * 일괄 작업의 에러를 처리
   */
  handleBulkErrors<T>(
    results: Array<Result<T> | Error>,
    operation: string
  ): { 
    success: T[]; 
    errors: ProblemBankError[]; 
    summary: ProblemBankError | null 
  } {
    const success: T[] = [];
    const errors: ProblemBankError[] = [];

    results.forEach((result, index) => {
      if (result instanceof Error) {
        errors.push(this.normalizeToProblemBankError(result, { operation, additionalContext: { index } }));
      } else if (result.isFailure) {
        errors.push(new ProblemBankError(
          ProblemBankErrorCode.BULK_OPERATION_FAILED,
          result.error || 'Unknown error',
          { operation, index }
        ));
      } else {
        success.push(result.value);
      }
    });

    let summary: ProblemBankError | null = null;
    if (errors.length > 0) {
      summary = ProblemBankErrorFactory.bulkOperationFailed(
        operation,
        success.length,
        results.length,
        errors.map(e => e.message)
      );
    }

    return { success, errors, summary };
  }

  /**
   * 유효성 검사 에러들을 집계
   */
  handleValidationErrors(
    validationResults: Array<{ field: string; error?: string }>
  ): ProblemBankError | null {
    const errors = validationResults
      .filter(result => result.error)
      .map(result => ({ field: result.field, message: result.error! }));

    if (errors.length === 0) {
      return null;
    }

    return ProblemBankErrorFactory.validationFailed(errors);
  }

  /**
   * 재시도 가능한 에러인지 판단
   */
  isRetryable(error: unknown): boolean {
    if (error instanceof ProblemBankError) {
      const retryableCodes = [
        ProblemBankErrorCode.DATABASE_ERROR,
        ProblemBankErrorCode.NETWORK_ERROR,
        ProblemBankErrorCode.TIMEOUT_ERROR,
        ProblemBankErrorCode.CACHE_READ_FAILED,
        ProblemBankErrorCode.CACHE_WRITE_FAILED
      ];
      return retryableCodes.includes(error.code);
    }

    return false;
  }

  /**
   * 치명적 에러인지 판단
   */
  isCritical(error: unknown): boolean {
    if (error instanceof ProblemBankError) {
      const criticalCodes = [
        ProblemBankErrorCode.DATABASE_ERROR,
        ProblemBankErrorCode.UNEXPECTED_ERROR
      ];
      return criticalCodes.includes(error.code);
    }

    return false;
  }

  private normalizeToProblemBankError(error: unknown, context?: ErrorContext): ProblemBankError {
    if (error instanceof ProblemBankError) {
      return error;
    }

    if (error instanceof Error) {
      // 특정 에러 패턴 인식
      if (error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT')) {
        return new ProblemBankError(
          ProblemBankErrorCode.NETWORK_ERROR,
          'Network connection failed',
          { originalMessage: error.message, operation: context?.operation },
          error
        );
      }

      if (error.message.includes('timeout')) {
        return new ProblemBankError(
          ProblemBankErrorCode.TIMEOUT_ERROR,
          'Operation timed out',
          { originalMessage: error.message, operation: context?.operation },
          error
        );
      }

      // 일반적인 에러를 ProblemBankError로 변환
      return new ProblemBankError(
        ProblemBankErrorCode.UNEXPECTED_ERROR,
        error.message,
        { originalError: error.name, operation: context?.operation },
        error
      );
    }

    // 문자열 또는 기타 타입의 에러
    const errorMessage = typeof error === 'string' ? error : 'Unknown error occurred';
    return new ProblemBankError(
      ProblemBankErrorCode.UNEXPECTED_ERROR,
      errorMessage,
      { originalError: error, operation: context?.operation }
    );
  }

  private logError(error: ProblemBankError, context?: ErrorContext): void {
    const logContext = {
      errorCode: error.code,
      errorMessage: error.message,
      errorContext: error.context,
      ...context?.additionalContext
    };

    const logMetadata = {
      correlationId: context?.correlationId,
      userId: context?.userId,
      requestId: context?.requestId,
      operation: context?.operation,
      timestamp: error.timestamp
    };

    // 에러 심각도에 따라 로그 레벨 결정
    if (this.isCritical(error)) {
      this.logger.error(`Critical error: ${error.message}`, logContext, logMetadata);
    } else if (error.code === ProblemBankErrorCode.UNAUTHORIZED_ACCESS) {
      this.logger.warn(`Authorization error: ${error.message}`, logContext, logMetadata);
    } else if (error.code === ProblemBankErrorCode.PROBLEM_NOT_FOUND) {
      this.logger.info(`Resource not found: ${error.message}`, logContext, logMetadata);
    } else {
      this.logger.error(`Application error: ${error.message}`, logContext, logMetadata);
    }
  }

  private createErrorResponse(error: ProblemBankError, context?: ErrorContext): ErrorResponse {
    const response: ErrorResponse = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        userMessage: error.toUserMessage(),
        timestamp: error.timestamp.toISOString(),
        correlationId: context?.correlationId
      }
    };

    // 개발 환경에서는 추가 정보 제공
    if (this.config.environment === 'development' || this.config.enableDetailedErrors) {
      response.error.details = error.context;
    }

    // 스택 트레이스 포함 여부
    if (this.config.enableStackTrace && error.stack) {
      response.error.stack = error.stack;
    }

    return response;
  }
}

// 글로벌 에러 핸들러 싱글톤
export class GlobalErrorHandler {
  private static instance: ErrorHandler | null = null;

  static initialize(config: ErrorHandlerConfig): void {
    GlobalErrorHandler.instance = new ErrorHandler(config);
  }

  static getInstance(): ErrorHandler {
    if (!GlobalErrorHandler.instance) {
      throw new Error('GlobalErrorHandler not initialized. Call initialize() first.');
    }
    return GlobalErrorHandler.instance;
  }

  static handleError(error: unknown, context?: ErrorContext): ErrorResponse {
    return GlobalErrorHandler.getInstance().handleError(error, context);
  }

  static handleErrorAsResult<T>(error: unknown, context?: ErrorContext): Result<T> {
    return GlobalErrorHandler.getInstance().handleErrorAsResult(error, context);
  }
}