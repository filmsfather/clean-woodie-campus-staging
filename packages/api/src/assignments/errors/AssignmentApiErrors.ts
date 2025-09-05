export class AssignmentApiError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: any;

  constructor(
    message: string,
    code: string,
    statusCode: number = 400,
    details?: any
  ) {
    super(message);
    this.name = 'AssignmentApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;

    Object.setPrototypeOf(this, AssignmentApiError.prototype);
  }
}

export class AssignmentNotFoundError extends AssignmentApiError {
  constructor(assignmentId: string) {
    super(
      `Assignment with ID '${assignmentId}' not found`,
      'ASSIGNMENT_NOT_FOUND',
      404,
      { assignmentId }
    );
  }
}

export class AssignmentAccessDeniedError extends AssignmentApiError {
  constructor(assignmentId: string, userId: string) {
    super(
      'Access denied to assignment',
      'ASSIGNMENT_ACCESS_DENIED',
      403,
      { assignmentId, userId }
    );
  }
}

export class InvalidAssignmentStateError extends AssignmentApiError {
  constructor(currentState: string, attemptedAction: string) {
    super(
      `Cannot ${attemptedAction} assignment in ${currentState} state`,
      'INVALID_ASSIGNMENT_STATE',
      400,
      { currentState, attemptedAction }
    );
  }
}

export class DueDateInPastError extends AssignmentApiError {
  constructor(dueDate: Date) {
    super(
      'Due date cannot be in the past',
      'DUE_DATE_IN_PAST',
      422,
      { dueDate: dueDate.toISOString() }
    );
  }
}

export class NoTargetsProvidedError extends AssignmentApiError {
  constructor() {
    super(
      'At least one target (class or student) must be provided',
      'NO_TARGETS_PROVIDED',
      422
    );
  }
}

export class InvalidTargetTypeError extends AssignmentApiError {
  constructor(targetType: string) {
    super(
      `Invalid target type: ${targetType}`,
      'INVALID_TARGET_TYPE',
      422,
      { targetType }
    );
  }
}

export class MaxAttemptsExceededError extends AssignmentApiError {
  constructor(maxAttempts: number) {
    super(
      `Max attempts (${maxAttempts}) cannot exceed system limit`,
      'MAX_ATTEMPTS_EXCEEDED',
      422,
      { maxAttempts }
    );
  }
}

export class ExtensionTooLargeError extends AssignmentApiError {
  constructor(extensionDays: number, maxAllowed: number) {
    super(
      `Extension of ${extensionDays} days exceeds maximum allowed (${maxAllowed} days)`,
      'EXTENSION_TOO_LARGE',
      422,
      { extensionDays, maxAllowed }
    );
  }
}

export class AssignmentAlreadyExistsError extends AssignmentApiError {
  constructor(targetId: string, targetType: string) {
    super(
      `Assignment already exists for ${targetType} ${targetId}`,
      'ASSIGNMENT_ALREADY_EXISTS',
      409,
      { targetId, targetType }
    );
  }
}

export class TargetNotFoundError extends AssignmentApiError {
  constructor(targetId: string, targetType: string) {
    super(
      `${targetType} with ID '${targetId}' not found`,
      'TARGET_NOT_FOUND',
      404,
      { targetId, targetType }
    );
  }
}

export class ProblemSetNotFoundError extends AssignmentApiError {
  constructor(problemSetId: string) {
    super(
      `Problem set with ID '${problemSetId}' not found`,
      'PROBLEM_SET_NOT_FOUND',
      404,
      { problemSetId }
    );
  }
}

export class TeacherNotFoundError extends AssignmentApiError {
  constructor(teacherId: string) {
    super(
      `Teacher with ID '${teacherId}' not found`,
      'TEACHER_NOT_FOUND',
      404,
      { teacherId }
    );
  }
}

export class AssignmentValidationError extends AssignmentApiError {
  constructor(validationErrors: Array<{ field: string; message: string; value?: any }>) {
    super(
      'Assignment validation failed',
      'ASSIGNMENT_VALIDATION_ERROR',
      422,
      { validationErrors }
    );
  }
}

export class BatchOperationError extends AssignmentApiError {
  constructor(
    operation: string,
    successful: number,
    failed: number,
    errors: Array<{ id: string; error: string }>
  ) {
    super(
      `Batch ${operation} completed with ${successful} successes and ${failed} failures`,
      'BATCH_OPERATION_ERROR',
      207, // Multi-Status
      { operation, successful, failed, errors }
    );
  }
}

export class ConcurrencyError extends AssignmentApiError {
  constructor(assignmentId: string) {
    super(
      'Assignment was modified by another user. Please refresh and try again.',
      'CONCURRENCY_ERROR',
      409,
      { assignmentId }
    );
  }
}

export class RateLimitExceededError extends AssignmentApiError {
  constructor(operation: string, retryAfter?: number) {
    super(
      `Rate limit exceeded for ${operation}`,
      'RATE_LIMIT_EXCEEDED',
      429,
      { operation, retryAfter }
    );
  }
}

export class ServiceUnavailableError extends AssignmentApiError {
  constructor(service: string, details?: string) {
    super(
      `${service} service is currently unavailable`,
      'SERVICE_UNAVAILABLE',
      503,
      { service, details }
    );
  }
}