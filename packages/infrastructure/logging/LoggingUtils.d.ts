import { LogContext, LogMetadata } from '@woodie/application/common/interfaces/ILogger';
export declare class LoggingUtils {
    /**
     * 상관관계 ID 생성
     */
    static generateCorrelationId(): string;
    /**
     * 요청 ID 생성
     */
    static generateRequestId(): string;
    /**
     * 에러를 로그 컨텍스트로 변환
     */
    static errorToContext(error: Error): LogContext;
    /**
     * HTTP 요청 정보를 로그 컨텍스트로 변환
     */
    static requestToContext(req: any): LogContext;
    /**
     * 성능 메트릭을 로그 컨텍스트로 변환
     */
    static performanceToContext(startTime: number, endTime?: number): LogContext;
    /**
     * 데이터베이스 쿼리 정보를 로그 컨텍스트로 변환
     */
    static queryToContext(query: string, params?: any[], duration?: number): LogContext;
    /**
     * API 응답을 로그 컨텍스트로 변환
     */
    static responseToContext(statusCode: number, responseTime?: number, responseSize?: number): LogContext;
    /**
     * 민감한 데이터 감지
     */
    private static isSensitiveData;
    /**
     * 민감한 데이터 마스킹
     */
    private static maskSensitiveData;
    /**
     * 메타데이터 빌더
     */
    static buildMetadata(options: {
        correlationId?: string;
        userId?: string;
        sessionId?: string;
        requestId?: string;
        operation?: string;
        duration?: number;
        startTime?: number;
        endTime?: number;
    }): LogMetadata;
    /**
     * 함수 실행 시간을 측정하고 로깅하는 데코레이터
     */
    static logExecutionTime<T extends (...args: any[]) => any>(target: T, operation: string, logger: any): T;
}
//# sourceMappingURL=LoggingUtils.d.ts.map