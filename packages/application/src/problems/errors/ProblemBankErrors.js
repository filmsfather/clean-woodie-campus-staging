// 문제 뱅크 에러 표준화
export var ProblemBankErrorCode;
(function (ProblemBankErrorCode) {
    // 기본 CRUD 에러
    ProblemBankErrorCode["PROBLEM_NOT_FOUND"] = "PROBLEM_NOT_FOUND";
    ProblemBankErrorCode["PROBLEM_CREATE_FAILED"] = "PROBLEM_CREATE_FAILED";
    ProblemBankErrorCode["PROBLEM_UPDATE_FAILED"] = "PROBLEM_UPDATE_FAILED";
    ProblemBankErrorCode["PROBLEM_DELETE_FAILED"] = "PROBLEM_DELETE_FAILED";
    // 권한 관련 에러
    ProblemBankErrorCode["UNAUTHORIZED_ACCESS"] = "UNAUTHORIZED_ACCESS";
    ProblemBankErrorCode["OWNERSHIP_VERIFICATION_FAILED"] = "OWNERSHIP_VERIFICATION_FAILED";
    ProblemBankErrorCode["INSUFFICIENT_PERMISSIONS"] = "INSUFFICIENT_PERMISSIONS";
    // 검색 및 조회 에러
    ProblemBankErrorCode["SEARCH_FAILED"] = "SEARCH_FAILED";
    ProblemBankErrorCode["INVALID_SEARCH_FILTER"] = "INVALID_SEARCH_FILTER";
    ProblemBankErrorCode["PAGINATION_ERROR"] = "PAGINATION_ERROR";
    ProblemBankErrorCode["SORT_PARAMETER_INVALID"] = "SORT_PARAMETER_INVALID";
    // 일괄 작업 에러
    ProblemBankErrorCode["BULK_OPERATION_FAILED"] = "BULK_OPERATION_FAILED";
    ProblemBankErrorCode["BULK_VALIDATION_FAILED"] = "BULK_VALIDATION_FAILED";
    ProblemBankErrorCode["PARTIAL_BULK_SUCCESS"] = "PARTIAL_BULK_SUCCESS";
    // 복제 관련 에러
    ProblemBankErrorCode["CLONE_OPERATION_FAILED"] = "CLONE_OPERATION_FAILED";
    ProblemBankErrorCode["CLONE_PERMISSION_DENIED"] = "CLONE_PERMISSION_DENIED";
    ProblemBankErrorCode["CLONE_VALIDATION_FAILED"] = "CLONE_VALIDATION_FAILED";
    // 분석 및 통계 에러
    ProblemBankErrorCode["STATISTICS_CALCULATION_FAILED"] = "STATISTICS_CALCULATION_FAILED";
    ProblemBankErrorCode["TAG_ANALYSIS_FAILED"] = "TAG_ANALYSIS_FAILED";
    ProblemBankErrorCode["DIFFICULTY_ANALYSIS_FAILED"] = "DIFFICULTY_ANALYSIS_FAILED";
    ProblemBankErrorCode["RECOMMENDATION_FAILED"] = "RECOMMENDATION_FAILED";
    // 내보내기/가져오기 에러
    ProblemBankErrorCode["EXPORT_FAILED"] = "EXPORT_FAILED";
    ProblemBankErrorCode["IMPORT_FAILED"] = "IMPORT_FAILED";
    ProblemBankErrorCode["INVALID_EXPORT_FORMAT"] = "INVALID_EXPORT_FORMAT";
    ProblemBankErrorCode["INVALID_IMPORT_DATA"] = "INVALID_IMPORT_DATA";
    // 캐시 관련 에러
    ProblemBankErrorCode["CACHE_READ_FAILED"] = "CACHE_READ_FAILED";
    ProblemBankErrorCode["CACHE_WRITE_FAILED"] = "CACHE_WRITE_FAILED";
    ProblemBankErrorCode["CACHE_INVALIDATION_FAILED"] = "CACHE_INVALIDATION_FAILED";
    // 도메인 서비스 에러
    ProblemBankErrorCode["DOMAIN_SERVICE_ERROR"] = "DOMAIN_SERVICE_ERROR";
    ProblemBankErrorCode["TAG_MANAGEMENT_ERROR"] = "TAG_MANAGEMENT_ERROR";
    ProblemBankErrorCode["DIFFICULTY_SERVICE_ERROR"] = "DIFFICULTY_SERVICE_ERROR";
    // 시스템 에러
    ProblemBankErrorCode["DATABASE_ERROR"] = "DATABASE_ERROR";
    ProblemBankErrorCode["NETWORK_ERROR"] = "NETWORK_ERROR";
    ProblemBankErrorCode["TIMEOUT_ERROR"] = "TIMEOUT_ERROR";
    ProblemBankErrorCode["UNEXPECTED_ERROR"] = "UNEXPECTED_ERROR";
})(ProblemBankErrorCode || (ProblemBankErrorCode = {}));
export class ProblemBankError extends Error {
    code;
    timestamp;
    context;
    cause;
    constructor(code, message, context, cause) {
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
    toLogObject() {
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
    toHttpStatus() {
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
    toUserMessage() {
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
    static notFound(problemId) {
        return new ProblemBankError(ProblemBankErrorCode.PROBLEM_NOT_FOUND, `Problem not found: ${problemId}`, { problemId });
    }
    static unauthorized(teacherId, problemId) {
        return new ProblemBankError(ProblemBankErrorCode.UNAUTHORIZED_ACCESS, `Unauthorized access for teacher: ${teacherId}`, { teacherId, problemId });
    }
    static bulkOperationFailed(operation, successCount, totalCount, errors) {
        return new ProblemBankError(ProblemBankErrorCode.BULK_OPERATION_FAILED, `Bulk ${operation} failed: ${successCount}/${totalCount} succeeded`, { operation, successCount, totalCount, errors });
    }
    static searchFailed(filter, cause) {
        return new ProblemBankError(ProblemBankErrorCode.SEARCH_FAILED, 'Problem search operation failed', { filter }, cause);
    }
    static tagAnalysisFailed(teacherId, cause) {
        return new ProblemBankError(ProblemBankErrorCode.TAG_ANALYSIS_FAILED, `Tag analysis failed for teacher: ${teacherId}`, { teacherId }, cause);
    }
    static cacheOperationFailed(operation, key, cause) {
        const codeMap = {
            read: ProblemBankErrorCode.CACHE_READ_FAILED,
            write: ProblemBankErrorCode.CACHE_WRITE_FAILED,
            invalidate: ProblemBankErrorCode.CACHE_INVALIDATION_FAILED
        };
        return new ProblemBankError(codeMap[operation], `Cache ${operation} failed for key: ${key}`, { operation, key }, cause);
    }
    static domainServiceError(service, method, cause) {
        return new ProblemBankError(ProblemBankErrorCode.DOMAIN_SERVICE_ERROR, `Domain service error: ${service}.${method}`, { service, method }, cause);
    }
    static validationFailed(errors) {
        return new ProblemBankError(ProblemBankErrorCode.BULK_VALIDATION_FAILED, 'Validation failed', { validationErrors: errors });
    }
    static fromRepositoryError(repositoryError) {
        // Repository 에러 메시지를 분석하여 적절한 에러 코드 결정
        if (repositoryError.includes('not found')) {
            return new ProblemBankError(ProblemBankErrorCode.PROBLEM_NOT_FOUND, repositoryError);
        }
        if (repositoryError.includes('unauthorized') || repositoryError.includes('permission')) {
            return new ProblemBankError(ProblemBankErrorCode.UNAUTHORIZED_ACCESS, repositoryError);
        }
        if (repositoryError.includes('database') || repositoryError.includes('connection')) {
            return new ProblemBankError(ProblemBankErrorCode.DATABASE_ERROR, repositoryError);
        }
        return new ProblemBankError(ProblemBankErrorCode.UNEXPECTED_ERROR, repositoryError);
    }
}
// 에러 체이닝을 위한 유틸리티
export class ErrorChain {
    errors = [];
    add(error) {
        this.errors.push(error);
        return this;
    }
    hasErrors() {
        return this.errors.length > 0;
    }
    getErrors() {
        return [...this.errors];
    }
    getFirstError() {
        return this.errors[0] || null;
    }
    toBulkError(operation) {
        const errorMessages = this.errors.map(e => e.message);
        return ProblemBankErrorFactory.bulkOperationFailed(operation, 0, // 실패한 경우이므로 성공 카운트는 0
        this.errors.length, errorMessages);
    }
}
//# sourceMappingURL=ProblemBankErrors.js.map