// Domain-Specific Errors for Problem Use Cases
import { Result } from '@woodie/domain/common/Result';
// 도메인 오류 코드
export var ProblemUseCaseErrorCode;
(function (ProblemUseCaseErrorCode) {
    // 인증/권한 오류
    ProblemUseCaseErrorCode["UNAUTHORIZED"] = "PROBLEM_UNAUTHORIZED";
    ProblemUseCaseErrorCode["ACCESS_DENIED"] = "PROBLEM_ACCESS_DENIED";
    // 입력 검증 오류
    ProblemUseCaseErrorCode["INVALID_INPUT"] = "PROBLEM_INVALID_INPUT";
    ProblemUseCaseErrorCode["REQUIRED_FIELD_MISSING"] = "PROBLEM_REQUIRED_FIELD_MISSING";
    ProblemUseCaseErrorCode["INVALID_PROBLEM_TYPE"] = "PROBLEM_INVALID_TYPE";
    ProblemUseCaseErrorCode["INVALID_DIFFICULTY"] = "PROBLEM_INVALID_DIFFICULTY";
    ProblemUseCaseErrorCode["INVALID_TAGS"] = "PROBLEM_INVALID_TAGS";
    // 비즈니스 규칙 오류
    ProblemUseCaseErrorCode["PROBLEM_NOT_FOUND"] = "PROBLEM_NOT_FOUND";
    ProblemUseCaseErrorCode["PROBLEM_ALREADY_ACTIVE"] = "PROBLEM_ALREADY_ACTIVE";
    ProblemUseCaseErrorCode["PROBLEM_ALREADY_INACTIVE"] = "PROBLEM_ALREADY_INACTIVE";
    ProblemUseCaseErrorCode["PROBLEM_IN_USE"] = "PROBLEM_IN_USE";
    ProblemUseCaseErrorCode["CANNOT_DELETE_ACTIVE_PROBLEM"] = "PROBLEM_CANNOT_DELETE_ACTIVE";
    // 시스템 오류
    ProblemUseCaseErrorCode["REPOSITORY_ERROR"] = "PROBLEM_REPOSITORY_ERROR";
    ProblemUseCaseErrorCode["SEARCH_SERVICE_ERROR"] = "PROBLEM_SEARCH_SERVICE_ERROR";
    ProblemUseCaseErrorCode["UNEXPECTED_ERROR"] = "PROBLEM_UNEXPECTED_ERROR";
})(ProblemUseCaseErrorCode || (ProblemUseCaseErrorCode = {}));
// 도메인 오류 클래스
export class ProblemUseCaseError extends Error {
    code;
    message;
    details;
    constructor(code, message, details) {
        super(message);
        this.code = code;
        this.message = message;
        this.details = details;
        this.name = 'ProblemUseCaseError';
    }
    static unauthorized(message = 'Unauthorized access') {
        return new ProblemUseCaseError(ProblemUseCaseErrorCode.UNAUTHORIZED, message);
    }
    static accessDenied(message = 'Access denied') {
        return new ProblemUseCaseError(ProblemUseCaseErrorCode.ACCESS_DENIED, message);
    }
    static invalidInput(message, details) {
        return new ProblemUseCaseError(ProblemUseCaseErrorCode.INVALID_INPUT, message, details);
    }
    static requiredFieldMissing(fieldName) {
        return new ProblemUseCaseError(ProblemUseCaseErrorCode.REQUIRED_FIELD_MISSING, `Required field '${fieldName}' is missing`);
    }
    static problemNotFound(problemId) {
        return new ProblemUseCaseError(ProblemUseCaseErrorCode.PROBLEM_NOT_FOUND, `Problem with ID '${problemId}' not found`);
    }
    static problemAlreadyActive() {
        return new ProblemUseCaseError(ProblemUseCaseErrorCode.PROBLEM_ALREADY_ACTIVE, 'Problem is already active');
    }
    static problemAlreadyInactive() {
        return new ProblemUseCaseError(ProblemUseCaseErrorCode.PROBLEM_ALREADY_INACTIVE, 'Problem is already inactive');
    }
    static cannotDeleteActiveProblem() {
        return new ProblemUseCaseError(ProblemUseCaseErrorCode.CANNOT_DELETE_ACTIVE_PROBLEM, 'Cannot delete an active problem. Deactivate it first.');
    }
    static repositoryError(message, details) {
        return new ProblemUseCaseError(ProblemUseCaseErrorCode.REPOSITORY_ERROR, `Repository error: ${message}`, details);
    }
    static searchServiceError(message, details) {
        return new ProblemUseCaseError(ProblemUseCaseErrorCode.SEARCH_SERVICE_ERROR, `Search service error: ${message}`, details);
    }
    static unexpectedError(message, details) {
        return new ProblemUseCaseError(ProblemUseCaseErrorCode.UNEXPECTED_ERROR, `Unexpected error: ${message}`, details);
    }
}
// 오류를 Result로 변환하는 헬퍼 함수들
export class ProblemUseCaseErrorFactory {
    static failWith(error) {
        return Result.fail(error.message);
    }
    static unauthorized(message) {
        return Result.fail(ProblemUseCaseError.unauthorized(message).message);
    }
    static accessDenied(message) {
        return Result.fail(ProblemUseCaseError.accessDenied(message).message);
    }
    static invalidInput(message, details) {
        return Result.fail(ProblemUseCaseError.invalidInput(message, details).message);
    }
    static problemNotFound(problemId) {
        return Result.fail(ProblemUseCaseError.problemNotFound(problemId).message);
    }
    static repositoryError(message) {
        return Result.fail(ProblemUseCaseError.repositoryError(message).message);
    }
    static requiredFieldMissing(fieldName) {
        return Result.fail(ProblemUseCaseError.requiredFieldMissing(fieldName).message);
    }
    static unexpectedError(message, details) {
        return Result.fail(ProblemUseCaseError.unexpectedError(message, details).message);
    }
}
//# sourceMappingURL=ProblemUseCaseErrors.js.map