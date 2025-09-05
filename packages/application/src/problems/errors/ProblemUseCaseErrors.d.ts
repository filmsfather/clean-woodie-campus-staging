import { Result } from '@woodie/domain/common/Result';
export declare enum ProblemUseCaseErrorCode {
    UNAUTHORIZED = "PROBLEM_UNAUTHORIZED",
    ACCESS_DENIED = "PROBLEM_ACCESS_DENIED",
    INVALID_INPUT = "PROBLEM_INVALID_INPUT",
    REQUIRED_FIELD_MISSING = "PROBLEM_REQUIRED_FIELD_MISSING",
    INVALID_PROBLEM_TYPE = "PROBLEM_INVALID_TYPE",
    INVALID_DIFFICULTY = "PROBLEM_INVALID_DIFFICULTY",
    INVALID_TAGS = "PROBLEM_INVALID_TAGS",
    PROBLEM_NOT_FOUND = "PROBLEM_NOT_FOUND",
    PROBLEM_ALREADY_ACTIVE = "PROBLEM_ALREADY_ACTIVE",
    PROBLEM_ALREADY_INACTIVE = "PROBLEM_ALREADY_INACTIVE",
    PROBLEM_IN_USE = "PROBLEM_IN_USE",
    CANNOT_DELETE_ACTIVE_PROBLEM = "PROBLEM_CANNOT_DELETE_ACTIVE",
    REPOSITORY_ERROR = "PROBLEM_REPOSITORY_ERROR",
    SEARCH_SERVICE_ERROR = "PROBLEM_SEARCH_SERVICE_ERROR",
    UNEXPECTED_ERROR = "PROBLEM_UNEXPECTED_ERROR"
}
export declare class ProblemUseCaseError extends Error {
    readonly code: ProblemUseCaseErrorCode;
    readonly message: string;
    readonly details?: any | undefined;
    constructor(code: ProblemUseCaseErrorCode, message: string, details?: any | undefined);
    static unauthorized(message?: string): ProblemUseCaseError;
    static accessDenied(message?: string): ProblemUseCaseError;
    static invalidInput(message: string, details?: any): ProblemUseCaseError;
    static requiredFieldMissing(fieldName: string): ProblemUseCaseError;
    static problemNotFound(problemId: string): ProblemUseCaseError;
    static problemAlreadyActive(): ProblemUseCaseError;
    static problemAlreadyInactive(): ProblemUseCaseError;
    static cannotDeleteActiveProblem(): ProblemUseCaseError;
    static repositoryError(message: string, details?: any): ProblemUseCaseError;
    static searchServiceError(message: string, details?: any): ProblemUseCaseError;
    static unexpectedError(message: string, details?: any): ProblemUseCaseError;
}
export declare class ProblemUseCaseErrorFactory {
    static failWith<T>(error: ProblemUseCaseError): Result<T>;
    static unauthorized<T>(message?: string): Result<T>;
    static accessDenied<T>(message?: string): Result<T>;
    static invalidInput<T>(message: string, details?: any): Result<T>;
    static problemNotFound<T>(problemId: string): Result<T>;
    static repositoryError<T>(message: string): Result<T>;
    static requiredFieldMissing<T>(fieldName: string): Result<T>;
    static unexpectedError<T>(message: string, details?: any): Result<T>;
}
//# sourceMappingURL=ProblemUseCaseErrors.d.ts.map