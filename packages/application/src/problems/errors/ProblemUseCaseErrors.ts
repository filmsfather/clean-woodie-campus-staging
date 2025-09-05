// Domain-Specific Errors for Problem Use Cases
import { Result } from '@woodie/domain/common/Result';

// 도메인 오류 코드
export enum ProblemUseCaseErrorCode {
  // 인증/권한 오류
  UNAUTHORIZED = 'PROBLEM_UNAUTHORIZED',
  ACCESS_DENIED = 'PROBLEM_ACCESS_DENIED',
  
  // 입력 검증 오류
  INVALID_INPUT = 'PROBLEM_INVALID_INPUT',
  REQUIRED_FIELD_MISSING = 'PROBLEM_REQUIRED_FIELD_MISSING',
  INVALID_PROBLEM_TYPE = 'PROBLEM_INVALID_TYPE',
  INVALID_DIFFICULTY = 'PROBLEM_INVALID_DIFFICULTY',
  INVALID_TAGS = 'PROBLEM_INVALID_TAGS',
  
  // 비즈니스 규칙 오류
  PROBLEM_NOT_FOUND = 'PROBLEM_NOT_FOUND',
  PROBLEM_ALREADY_ACTIVE = 'PROBLEM_ALREADY_ACTIVE',
  PROBLEM_ALREADY_INACTIVE = 'PROBLEM_ALREADY_INACTIVE',
  PROBLEM_IN_USE = 'PROBLEM_IN_USE',
  CANNOT_DELETE_ACTIVE_PROBLEM = 'PROBLEM_CANNOT_DELETE_ACTIVE',
  
  // 시스템 오류
  REPOSITORY_ERROR = 'PROBLEM_REPOSITORY_ERROR',
  SEARCH_SERVICE_ERROR = 'PROBLEM_SEARCH_SERVICE_ERROR',
  UNEXPECTED_ERROR = 'PROBLEM_UNEXPECTED_ERROR'
}

// 도메인 오류 클래스
export class ProblemUseCaseError extends Error {
  constructor(
    public readonly code: ProblemUseCaseErrorCode,
    public readonly message: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'ProblemUseCaseError';
  }

  static unauthorized(message: string = 'Unauthorized access'): ProblemUseCaseError {
    return new ProblemUseCaseError(ProblemUseCaseErrorCode.UNAUTHORIZED, message);
  }

  static accessDenied(message: string = 'Access denied'): ProblemUseCaseError {
    return new ProblemUseCaseError(ProblemUseCaseErrorCode.ACCESS_DENIED, message);
  }

  static invalidInput(message: string, details?: any): ProblemUseCaseError {
    return new ProblemUseCaseError(ProblemUseCaseErrorCode.INVALID_INPUT, message, details);
  }

  static requiredFieldMissing(fieldName: string): ProblemUseCaseError {
    return new ProblemUseCaseError(
      ProblemUseCaseErrorCode.REQUIRED_FIELD_MISSING,
      `Required field '${fieldName}' is missing`
    );
  }

  static problemNotFound(problemId: string): ProblemUseCaseError {
    return new ProblemUseCaseError(
      ProblemUseCaseErrorCode.PROBLEM_NOT_FOUND,
      `Problem with ID '${problemId}' not found`
    );
  }

  static problemAlreadyActive(): ProblemUseCaseError {
    return new ProblemUseCaseError(
      ProblemUseCaseErrorCode.PROBLEM_ALREADY_ACTIVE,
      'Problem is already active'
    );
  }

  static problemAlreadyInactive(): ProblemUseCaseError {
    return new ProblemUseCaseError(
      ProblemUseCaseErrorCode.PROBLEM_ALREADY_INACTIVE,
      'Problem is already inactive'
    );
  }

  static cannotDeleteActiveProblem(): ProblemUseCaseError {
    return new ProblemUseCaseError(
      ProblemUseCaseErrorCode.CANNOT_DELETE_ACTIVE_PROBLEM,
      'Cannot delete an active problem. Deactivate it first.'
    );
  }

  static repositoryError(message: string, details?: any): ProblemUseCaseError {
    return new ProblemUseCaseError(
      ProblemUseCaseErrorCode.REPOSITORY_ERROR,
      `Repository error: ${message}`,
      details
    );
  }

  static searchServiceError(message: string, details?: any): ProblemUseCaseError {
    return new ProblemUseCaseError(
      ProblemUseCaseErrorCode.SEARCH_SERVICE_ERROR,
      `Search service error: ${message}`,
      details
    );
  }

  static unexpectedError(message: string, details?: any): ProblemUseCaseError {
    return new ProblemUseCaseError(
      ProblemUseCaseErrorCode.UNEXPECTED_ERROR,
      `Unexpected error: ${message}`,
      details
    );
  }
}

// 오류를 Result로 변환하는 헬퍼 함수들
export class ProblemUseCaseErrorFactory {
  static failWith<T>(error: ProblemUseCaseError): Result<T> {
    return Result.fail<T>(error.message);
  }

  static unauthorized<T>(message?: string): Result<T> {
    return Result.fail<T>(ProblemUseCaseError.unauthorized(message).message);
  }

  static accessDenied<T>(message?: string): Result<T> {
    return Result.fail<T>(ProblemUseCaseError.accessDenied(message).message);
  }

  static invalidInput<T>(message: string, details?: any): Result<T> {
    return Result.fail<T>(ProblemUseCaseError.invalidInput(message, details).message);
  }

  static problemNotFound<T>(problemId: string): Result<T> {
    return Result.fail<T>(ProblemUseCaseError.problemNotFound(problemId).message);
  }

  static repositoryError<T>(message: string): Result<T> {
    return Result.fail<T>(ProblemUseCaseError.repositoryError(message).message);
  }

  static requiredFieldMissing<T>(fieldName: string): Result<T> {
    return Result.fail<T>(ProblemUseCaseError.requiredFieldMissing(fieldName).message);
  }

  static unexpectedError<T>(message: string, details?: any): Result<T> {
    return Result.fail<T>(ProblemUseCaseError.unexpectedError(message, details).message);
  }
}