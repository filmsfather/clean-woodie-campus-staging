import { ProblemBankError } from '@woodie/application/problems/errors/ProblemBankErrors';
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
export declare class ErrorMapper {
    /**
     * 데이터베이스 에러를 ProblemBankError로 매핑
     */
    static mapDatabaseError(dbError: DatabaseError): ProblemBankError;
    /**
     * Redis 에러를 ProblemBankError로 매핑
     */
    static mapRedisError(redisError: Error, operation: 'read' | 'write' | 'delete'): ProblemBankError;
    /**
     * HTTP 에러를 ProblemBankError로 매핑
     */
    static mapHttpError(httpError: HttpError): ProblemBankError;
    /**
     * 유효성 검사 에러들을 ProblemBankError로 매핑
     */
    static mapValidationErrors(validationErrors: ValidationError[]): ProblemBankError;
    /**
     * Node.js 시스템 에러를 ProblemBankError로 매핑
     */
    static mapNodeError(nodeError: NodeJS.ErrnoException): ProblemBankError;
    /**
     * 일반적인 JavaScript Error를 ProblemBankError로 매핑
     */
    static mapGenericError(error: Error, operation?: string): ProblemBankError;
}
//# sourceMappingURL=ErrorMapper.d.ts.map