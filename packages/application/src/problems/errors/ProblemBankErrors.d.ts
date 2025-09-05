export declare enum ProblemBankErrorCode {
    PROBLEM_NOT_FOUND = "PROBLEM_NOT_FOUND",
    PROBLEM_CREATE_FAILED = "PROBLEM_CREATE_FAILED",
    PROBLEM_UPDATE_FAILED = "PROBLEM_UPDATE_FAILED",
    PROBLEM_DELETE_FAILED = "PROBLEM_DELETE_FAILED",
    UNAUTHORIZED_ACCESS = "UNAUTHORIZED_ACCESS",
    OWNERSHIP_VERIFICATION_FAILED = "OWNERSHIP_VERIFICATION_FAILED",
    INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",
    SEARCH_FAILED = "SEARCH_FAILED",
    INVALID_SEARCH_FILTER = "INVALID_SEARCH_FILTER",
    PAGINATION_ERROR = "PAGINATION_ERROR",
    SORT_PARAMETER_INVALID = "SORT_PARAMETER_INVALID",
    BULK_OPERATION_FAILED = "BULK_OPERATION_FAILED",
    BULK_VALIDATION_FAILED = "BULK_VALIDATION_FAILED",
    PARTIAL_BULK_SUCCESS = "PARTIAL_BULK_SUCCESS",
    CLONE_OPERATION_FAILED = "CLONE_OPERATION_FAILED",
    CLONE_PERMISSION_DENIED = "CLONE_PERMISSION_DENIED",
    CLONE_VALIDATION_FAILED = "CLONE_VALIDATION_FAILED",
    STATISTICS_CALCULATION_FAILED = "STATISTICS_CALCULATION_FAILED",
    TAG_ANALYSIS_FAILED = "TAG_ANALYSIS_FAILED",
    DIFFICULTY_ANALYSIS_FAILED = "DIFFICULTY_ANALYSIS_FAILED",
    RECOMMENDATION_FAILED = "RECOMMENDATION_FAILED",
    EXPORT_FAILED = "EXPORT_FAILED",
    IMPORT_FAILED = "IMPORT_FAILED",
    INVALID_EXPORT_FORMAT = "INVALID_EXPORT_FORMAT",
    INVALID_IMPORT_DATA = "INVALID_IMPORT_DATA",
    CACHE_READ_FAILED = "CACHE_READ_FAILED",
    CACHE_WRITE_FAILED = "CACHE_WRITE_FAILED",
    CACHE_INVALIDATION_FAILED = "CACHE_INVALIDATION_FAILED",
    DOMAIN_SERVICE_ERROR = "DOMAIN_SERVICE_ERROR",
    TAG_MANAGEMENT_ERROR = "TAG_MANAGEMENT_ERROR",
    DIFFICULTY_SERVICE_ERROR = "DIFFICULTY_SERVICE_ERROR",
    DATABASE_ERROR = "DATABASE_ERROR",
    NETWORK_ERROR = "NETWORK_ERROR",
    TIMEOUT_ERROR = "TIMEOUT_ERROR",
    UNEXPECTED_ERROR = "UNEXPECTED_ERROR"
}
export declare class ProblemBankError extends Error {
    readonly code: ProblemBankErrorCode;
    readonly timestamp: Date;
    readonly context?: Record<string, any>;
    readonly cause?: Error;
    constructor(code: ProblemBankErrorCode, message: string, context?: Record<string, any>, cause?: Error);
    toLogObject(): Record<string, any>;
    toHttpStatus(): number;
    toUserMessage(): string;
}
export declare class ProblemBankErrorFactory {
    static notFound(problemId: string): ProblemBankError;
    static unauthorized(teacherId: string, problemId?: string): ProblemBankError;
    static bulkOperationFailed(operation: string, successCount: number, totalCount: number, errors: string[]): ProblemBankError;
    static searchFailed(filter: any, cause?: Error): ProblemBankError;
    static tagAnalysisFailed(teacherId: string, cause?: Error): ProblemBankError;
    static cacheOperationFailed(operation: 'read' | 'write' | 'invalidate', key: string, cause?: Error): ProblemBankError;
    static domainServiceError(service: string, method: string, cause?: Error): ProblemBankError;
    static validationFailed(errors: Array<{
        field: string;
        message: string;
    }>): ProblemBankError;
    static fromRepositoryError(repositoryError: string): ProblemBankError;
}
export declare class ErrorChain {
    private errors;
    add(error: ProblemBankError): this;
    hasErrors(): boolean;
    getErrors(): ProblemBankError[];
    getFirstError(): ProblemBankError | null;
    toBulkError(operation: string): ProblemBankError;
}
//# sourceMappingURL=ProblemBankErrors.d.ts.map