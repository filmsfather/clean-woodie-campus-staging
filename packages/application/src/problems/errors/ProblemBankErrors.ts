// 문제 뱅크 에러 표준화

export enum ProblemBankErrorCode {
  // 기본 CRUD 에러
  PROBLEM_NOT_FOUND = 'PROBLEM_NOT_FOUND',
  PROBLEM_CREATE_FAILED = 'PROBLEM_CREATE_FAILED',
  PROBLEM_UPDATE_FAILED = 'PROBLEM_UPDATE_FAILED',
  PROBLEM_DELETE_FAILED = 'PROBLEM_DELETE_FAILED',
  
  // 권한 관련 에러
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  OWNERSHIP_VERIFICATION_FAILED = 'OWNERSHIP_VERIFICATION_FAILED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // 검색 및 조회 에러
  SEARCH_FAILED = 'SEARCH_FAILED',
  INVALID_SEARCH_FILTER = 'INVALID_SEARCH_FILTER',
  PAGINATION_ERROR = 'PAGINATION_ERROR',
  SORT_PARAMETER_INVALID = 'SORT_PARAMETER_INVALID',
  
  // 일괄 작업 에러
  BULK_OPERATION_FAILED = 'BULK_OPERATION_FAILED',
  BULK_VALIDATION_FAILED = 'BULK_VALIDATION_FAILED',
  PARTIAL_BULK_SUCCESS = 'PARTIAL_BULK_SUCCESS',
  
  // 복제 관련 에러
  CLONE_OPERATION_FAILED = 'CLONE_OPERATION_FAILED',
  CLONE_PERMISSION_DENIED = 'CLONE_PERMISSION_DENIED',
  CLONE_VALIDATION_FAILED = 'CLONE_VALIDATION_FAILED',
  
  // 분석 및 통계 에러
  STATISTICS_CALCULATION_FAILED = 'STATISTICS_CALCULATION_FAILED',
  TAG_ANALYSIS_FAILED = 'TAG_ANALYSIS_FAILED',
  DIFFICULTY_ANALYSIS_FAILED = 'DIFFICULTY_ANALYSIS_FAILED',
  RECOMMENDATION_FAILED = 'RECOMMENDATION_FAILED',
  
  // 내보내기/가져오기 에러
  EXPORT_FAILED = 'EXPORT_FAILED',
  IMPORT_FAILED = 'IMPORT_FAILED',
  INVALID_EXPORT_FORMAT = 'INVALID_EXPORT_FORMAT',
  INVALID_IMPORT_DATA = 'INVALID_IMPORT_DATA',
  
  // 캐시 관련 에러
  CACHE_READ_FAILED = 'CACHE_READ_FAILED',
  CACHE_WRITE_FAILED = 'CACHE_WRITE_FAILED',
  CACHE_INVALIDATION_FAILED = 'CACHE_INVALIDATION_FAILED',
  
  // 도메인 서비스 에러
  DOMAIN_SERVICE_ERROR = 'DOMAIN_SERVICE_ERROR',
  TAG_MANAGEMENT_ERROR = 'TAG_MANAGEMENT_ERROR',
  DIFFICULTY_SERVICE_ERROR = 'DIFFICULTY_SERVICE_ERROR',
  
  // 시스템 에러
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  UNEXPECTED_ERROR = 'UNEXPECTED_ERROR'
}

export class ProblemBankError extends Error {
  public readonly code: ProblemBankErrorCode;
  public readonly timestamp: Date;
  public readonly context?: Record<string, any>;
  public readonly cause?: Error;

  constructor(
    code: ProblemBankErrorCode,
    message: string,
    context?: Record<string, any>,
    cause?: Error
  ) {
    super(message);
    this.name = 'ProblemBankError';
    this.code = code;
    this.timestamp = new Date();
    this.context = context;
    this.cause = cause;
    
    // Stack trace 유지
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ProblemBankError);
    }
  }

  // 로깅을 위한 직렬화
  toLogObject(): Record<string, any> {
    return {
      errorType: 'ProblemBankError',
      code: this.code,
      message: this.message,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      stack: this.stack,
      cause: this.cause ? {
        name: this.cause.name,
        message: this.cause.message,
        stack: this.cause.stack
      } : undefined
    };
  }

  // HTTP 상태 코드 매핑
  toHttpStatus(): number {
    switch (this.code) {
      case ProblemBankErrorCode.PROBLEM_NOT_FOUND:
        return 404;
      case ProblemBankErrorCode.UNAUTHORIZED_ACCESS:
      case ProblemBankErrorCode.INSUFFICIENT_PERMISSIONS:
        return 403;
      case ProblemBankErrorCode.INVALID_SEARCH_FILTER:
      case ProblemBankErrorCode.INVALID_EXPORT_FORMAT:
      case ProblemBankErrorCode.INVALID_IMPORT_DATA:
      case ProblemBankErrorCode.PAGINATION_ERROR:
      case ProblemBankErrorCode.SORT_PARAMETER_INVALID:
        return 400;
      case ProblemBankErrorCode.TIMEOUT_ERROR:
        return 408;
      case ProblemBankErrorCode.DATABASE_ERROR:
      case ProblemBankErrorCode.UNEXPECTED_ERROR:
        return 500;
      default:
        return 500;
    }
  }

  // 사용자 친화적 메시지
  toUserMessage(): string {
    switch (this.code) {
      case ProblemBankErrorCode.PROBLEM_NOT_FOUND:
        return '요청하신 문제를 찾을 수 없습니다.';
      case ProblemBankErrorCode.UNAUTHORIZED_ACCESS:
        return '이 문제에 접근할 권한이 없습니다.';
      case ProblemBankErrorCode.BULK_OPERATION_FAILED:
        return '일괄 작업 처리 중 오류가 발생했습니다.';
      case ProblemBankErrorCode.SEARCH_FAILED:
        return '문제 검색 중 오류가 발생했습니다.';
      case ProblemBankErrorCode.EXPORT_FAILED:
        return '문제 내보내기 중 오류가 발생했습니다.';
      case ProblemBankErrorCode.IMPORT_FAILED:
        return '문제 가져오기 중 오류가 발생했습니다.';
      default:
        return '처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
    }
  }
}

// 에러 팩토리 메서드들
export class ProblemBankErrorFactory {
  static notFound(problemId: string): ProblemBankError {
    return new ProblemBankError(
      ProblemBankErrorCode.PROBLEM_NOT_FOUND,
      `Problem not found: ${problemId}`,
      { problemId }
    );
  }

  static unauthorized(teacherId: string, problemId?: string): ProblemBankError {
    return new ProblemBankError(
      ProblemBankErrorCode.UNAUTHORIZED_ACCESS,
      `Unauthorized access for teacher: ${teacherId}`,
      { teacherId, problemId }
    );
  }

  static bulkOperationFailed(
    operation: string,
    successCount: number,
    totalCount: number,
    errors: string[]
  ): ProblemBankError {
    return new ProblemBankError(
      ProblemBankErrorCode.BULK_OPERATION_FAILED,
      `Bulk ${operation} failed: ${successCount}/${totalCount} succeeded`,
      { operation, successCount, totalCount, errors }
    );
  }

  static searchFailed(filter: any, cause?: Error): ProblemBankError {
    return new ProblemBankError(
      ProblemBankErrorCode.SEARCH_FAILED,
      'Problem search operation failed',
      { filter },
      cause
    );
  }

  static tagAnalysisFailed(teacherId: string, cause?: Error): ProblemBankError {
    return new ProblemBankError(
      ProblemBankErrorCode.TAG_ANALYSIS_FAILED,
      `Tag analysis failed for teacher: ${teacherId}`,
      { teacherId },
      cause
    );
  }

  static cacheOperationFailed(
    operation: 'read' | 'write' | 'invalidate',
    key: string,
    cause?: Error
  ): ProblemBankError {
    const codeMap = {
      read: ProblemBankErrorCode.CACHE_READ_FAILED,
      write: ProblemBankErrorCode.CACHE_WRITE_FAILED,
      invalidate: ProblemBankErrorCode.CACHE_INVALIDATION_FAILED
    };

    return new ProblemBankError(
      codeMap[operation],
      `Cache ${operation} failed for key: ${key}`,
      { operation, key },
      cause
    );
  }

  static domainServiceError(
    service: string,
    method: string,
    cause?: Error
  ): ProblemBankError {
    return new ProblemBankError(
      ProblemBankErrorCode.DOMAIN_SERVICE_ERROR,
      `Domain service error: ${service}.${method}`,
      { service, method },
      cause
    );
  }

  static validationFailed(
    errors: Array<{ field: string; message: string }>
  ): ProblemBankError {
    return new ProblemBankError(
      ProblemBankErrorCode.BULK_VALIDATION_FAILED,
      'Validation failed',
      { validationErrors: errors }
    );
  }

  static fromRepositoryError(repositoryError: string): ProblemBankError {
    // Repository 에러 메시지를 분석하여 적절한 에러 코드 결정
    if (repositoryError.includes('not found')) {
      return new ProblemBankError(
        ProblemBankErrorCode.PROBLEM_NOT_FOUND,
        repositoryError
      );
    }

    if (repositoryError.includes('unauthorized') || repositoryError.includes('permission')) {
      return new ProblemBankError(
        ProblemBankErrorCode.UNAUTHORIZED_ACCESS,
        repositoryError
      );
    }

    if (repositoryError.includes('database') || repositoryError.includes('connection')) {
      return new ProblemBankError(
        ProblemBankErrorCode.DATABASE_ERROR,
        repositoryError
      );
    }

    return new ProblemBankError(
      ProblemBankErrorCode.UNEXPECTED_ERROR,
      repositoryError
    );
  }
}

// 에러 체이닝을 위한 유틸리티
export class ErrorChain {
  private errors: ProblemBankError[] = [];

  add(error: ProblemBankError): this {
    this.errors.push(error);
    return this;
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  getErrors(): ProblemBankError[] {
    return [...this.errors];
  }

  getFirstError(): ProblemBankError | null {
    return this.errors[0] || null;
  }

  toBulkError(operation: string): ProblemBankError {
    const errorMessages = this.errors.map(e => e.message);
    return ProblemBankErrorFactory.bulkOperationFailed(
      operation,
      0, // 실패한 경우이므로 성공 카운트는 0
      this.errors.length,
      errorMessages
    );
  }
}