import { 
  ProblemBankError, 
  ProblemBankErrorCode 
} from '@woodie/application/problems/errors/ProblemBankErrors';

export interface DatabaseError {
  code: string;
  message: string;
  detail?: string;
  constraint?: string;
  table?: string;
  column?: string;
}

export interface ValidationError {
  field: string;
  value: any;
  message: string;
  code?: string;
}

export interface HttpError {
  status: number;
  statusText: string;
  message: string;
  response?: any;
}

export class ErrorMapper {
  /**
   * 데이터베이스 에러를 ProblemBankError로 매핑
   */
  static mapDatabaseError(dbError: DatabaseError): ProblemBankError {
    const context = {
      dbCode: dbError.code,
      dbMessage: dbError.message,
      table: dbError.table,
      column: dbError.column,
      constraint: dbError.constraint,
      detail: dbError.detail
    };

    // PostgreSQL 에러 코드 매핑
    switch (dbError.code) {
      case '23502': // NOT NULL violation
      case '23503': // FOREIGN KEY violation  
      case '23505': // UNIQUE violation
      case '23514': // CHECK violation
        return new ProblemBankError(
          ProblemBankErrorCode.BULK_VALIDATION_FAILED,
          `Database constraint violation: ${dbError.message}`,
          context
        );

      case '42P01': // undefined_table
      case '42703': // undefined_column
        return new ProblemBankError(
          ProblemBankErrorCode.DATABASE_ERROR,
          `Database schema error: ${dbError.message}`,
          context
        );

      case '08006': // connection_failure
      case '08001': // sqlclient_unable_to_establish_sqlconnection
      case '08004': // sqlserver_rejected_establishment_of_sqlconnection
        return new ProblemBankError(
          ProblemBankErrorCode.NETWORK_ERROR,
          'Database connection failed',
          context
        );

      case '57014': // query_canceled (timeout)
        return new ProblemBankError(
          ProblemBankErrorCode.TIMEOUT_ERROR,
          'Database query timeout',
          context
        );

      case '53300': // too_many_connections
        return new ProblemBankError(
          ProblemBankErrorCode.DATABASE_ERROR,
          'Database connection pool exhausted',
          context
        );

      default:
        return new ProblemBankError(
          ProblemBankErrorCode.DATABASE_ERROR,
          `Database error: ${dbError.message}`,
          context
        );
    }
  }

  /**
   * Redis 에러를 ProblemBankError로 매핑
   */
  static mapRedisError(redisError: Error, operation: 'read' | 'write' | 'delete'): ProblemBankError {
    const context = {
      operation,
      redisMessage: redisError.message
    };

    // Redis 연결 에러
    if (redisError.message.includes('ECONNREFUSED') || 
        redisError.message.includes('Connection is closed')) {
      return new ProblemBankError(
        ProblemBankErrorCode.NETWORK_ERROR,
        'Redis connection failed',
        context,
        redisError
      );
    }

    // Redis 메모리 에러
    if (redisError.message.includes('OOM') || 
        redisError.message.includes('out of memory')) {
      return new ProblemBankError(
        ProblemBankErrorCode.CACHE_WRITE_FAILED,
        'Redis out of memory',
        context,
        redisError
      );
    }

    // Redis 인증 에러
    if (redisError.message.includes('NOAUTH') || 
        redisError.message.includes('invalid password')) {
      return new ProblemBankError(
        ProblemBankErrorCode.UNAUTHORIZED_ACCESS,
        'Redis authentication failed',
        context,
        redisError
      );
    }

    // 일반 Redis 에러
    const codeMap = {
      read: ProblemBankErrorCode.CACHE_READ_FAILED,
      write: ProblemBankErrorCode.CACHE_WRITE_FAILED,
      delete: ProblemBankErrorCode.CACHE_INVALIDATION_FAILED
    };

    return new ProblemBankError(
      codeMap[operation],
      `Redis ${operation} operation failed`,
      context,
      redisError
    );
  }

  /**
   * HTTP 에러를 ProblemBankError로 매핑
   */
  static mapHttpError(httpError: HttpError): ProblemBankError {
    const context = {
      httpStatus: httpError.status,
      httpStatusText: httpError.statusText,
      httpResponse: httpError.response
    };

    switch (httpError.status) {
      case 400:
        return new ProblemBankError(
          ProblemBankErrorCode.INVALID_SEARCH_FILTER,
          `Bad request: ${httpError.message}`,
          context
        );

      case 401:
        return new ProblemBankError(
          ProblemBankErrorCode.UNAUTHORIZED_ACCESS,
          'Authentication required',
          context
        );

      case 403:
        return new ProblemBankError(
          ProblemBankErrorCode.INSUFFICIENT_PERMISSIONS,
          'Access forbidden',
          context
        );

      case 404:
        return new ProblemBankError(
          ProblemBankErrorCode.PROBLEM_NOT_FOUND,
          'Resource not found',
          context
        );

      case 408:
        return new ProblemBankError(
          ProblemBankErrorCode.TIMEOUT_ERROR,
          'Request timeout',
          context
        );

      case 429:
        return new ProblemBankError(
          ProblemBankErrorCode.NETWORK_ERROR,
          'Too many requests',
          context
        );

      case 500:
      case 502:
      case 503:
      case 504:
        return new ProblemBankError(
          ProblemBankErrorCode.NETWORK_ERROR,
          `Server error: ${httpError.statusText}`,
          context
        );

      default:
        return new ProblemBankError(
          ProblemBankErrorCode.UNEXPECTED_ERROR,
          `HTTP error ${httpError.status}: ${httpError.message}`,
          context
        );
    }
  }

  /**
   * 유효성 검사 에러들을 ProblemBankError로 매핑
   */
  static mapValidationErrors(validationErrors: ValidationError[]): ProblemBankError {
    const errors = validationErrors.map(error => ({
      field: error.field,
      message: error.message
    }));

    return new ProblemBankError(
      ProblemBankErrorCode.BULK_VALIDATION_FAILED,
      'Validation failed',
      { validationErrors: errors }
    );
  }

  /**
   * Node.js 시스템 에러를 ProblemBankError로 매핑
   */
  static mapNodeError(nodeError: NodeJS.ErrnoException): ProblemBankError {
    const context = {
      errno: nodeError.errno,
      code: nodeError.code,
      syscall: nodeError.syscall,
      path: nodeError.path,
      address: (nodeError as any).address,
      port: (nodeError as any).port
    };

    switch (nodeError.code) {
      case 'ENOENT':
        return new ProblemBankError(
          ProblemBankErrorCode.PROBLEM_NOT_FOUND,
          `File or directory not found: ${nodeError.path}`,
          context,
          nodeError
        );

      case 'EACCES':
      case 'EPERM':
        return new ProblemBankError(
          ProblemBankErrorCode.INSUFFICIENT_PERMISSIONS,
          `Permission denied: ${nodeError.path}`,
          context,
          nodeError
        );

      case 'ECONNREFUSED':
      case 'EHOSTUNREACH':
      case 'ENETUNREACH':
        return new ProblemBankError(
          ProblemBankErrorCode.NETWORK_ERROR,
          `Network connection failed: ${(nodeError as any).address}:${(nodeError as any).port}`,
          context,
          nodeError
        );

      case 'ETIMEDOUT':
      case 'ESOCKETTIMEDOUT':
        return new ProblemBankError(
          ProblemBankErrorCode.TIMEOUT_ERROR,
          'Operation timed out',
          context,
          nodeError
        );

      case 'EMFILE':
      case 'ENFILE':
        return new ProblemBankError(
          ProblemBankErrorCode.UNEXPECTED_ERROR,
          'Too many open files',
          context,
          nodeError
        );

      case 'ENOSPC':
        return new ProblemBankError(
          ProblemBankErrorCode.UNEXPECTED_ERROR,
          'No space left on device',
          context,
          nodeError
        );

      default:
        return new ProblemBankError(
          ProblemBankErrorCode.UNEXPECTED_ERROR,
          nodeError.message,
          context,
          nodeError
        );
    }
  }

  /**
   * 일반적인 JavaScript Error를 ProblemBankError로 매핑
   */
  static mapGenericError(error: Error, operation?: string): ProblemBankError {
    const context = {
      originalErrorName: error.name,
      operation
    };

    // 특정 에러 타입 처리
    if (error instanceof TypeError) {
      return new ProblemBankError(
        ProblemBankErrorCode.BULK_VALIDATION_FAILED,
        `Type error: ${error.message}`,
        context,
        error
      );
    }

    if (error instanceof RangeError) {
      return new ProblemBankError(
        ProblemBankErrorCode.INVALID_SEARCH_FILTER,
        `Range error: ${error.message}`,
        context,
        error
      );
    }

    if (error instanceof ReferenceError) {
      return new ProblemBankError(
        ProblemBankErrorCode.UNEXPECTED_ERROR,
        `Reference error: ${error.message}`,
        context,
        error
      );
    }

    if (error instanceof SyntaxError) {
      return new ProblemBankError(
        ProblemBankErrorCode.INVALID_IMPORT_DATA,
        `Syntax error: ${error.message}`,
        context,
        error
      );
    }

    // 기본 처리
    return new ProblemBankError(
      ProblemBankErrorCode.UNEXPECTED_ERROR,
      error.message,
      context,
      error
    );
  }
}