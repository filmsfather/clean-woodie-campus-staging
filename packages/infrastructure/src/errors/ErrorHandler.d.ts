import { ProblemBankError } from '@woodie/application/problems/errors/ProblemBankErrors';
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
export declare class ErrorHandler {
    private readonly logger;
    private readonly config;
    constructor(config: ErrorHandlerConfig);
    /**
     * 에러를 처리하고 표준화된 응답 형태로 변환
     */
    handleError(error: unknown, context?: ErrorContext): ErrorResponse;
    /**
     * Result 타입으로 에러 처리
     */
    handleErrorAsResult<T>(error: unknown, context?: ErrorContext): Result<T>;
    /**
     * 비동기 함수를 래핑하여 에러 처리
     */
    wrapAsync<T extends (...args: any[]) => Promise<any>>(fn: T, operation: string): T;
    /**
     * 동기 함수를 래핑하여 에러 처리
     */
    wrapSync<T extends (...args: any[]) => any>(fn: T, operation: string): T;
    /**
     * 일괄 작업의 에러를 처리
     */
    handleBulkErrors<T>(results: Array<Result<T> | Error>, operation: string): {
        success: T[];
        errors: ProblemBankError[];
        summary: ProblemBankError | null;
    };
    /**
     * 유효성 검사 에러들을 집계
     */
    handleValidationErrors(validationResults: Array<{
        field: string;
        error?: string;
    }>): ProblemBankError | null;
    /**
     * 재시도 가능한 에러인지 판단
     */
    isRetryable(error: unknown): boolean;
    /**
     * 치명적 에러인지 판단
     */
    isCritical(error: unknown): boolean;
    private normalizeToProblemBankError;
    private logError;
    private createErrorResponse;
}
export declare class GlobalErrorHandler {
    private static instance;
    static initialize(config: ErrorHandlerConfig): void;
    static getInstance(): ErrorHandler;
    static handleError(error: unknown, context?: ErrorContext): ErrorResponse;
    static handleErrorAsResult<T>(error: unknown, context?: ErrorContext): Result<T>;
}
//# sourceMappingURL=ErrorHandler.d.ts.map