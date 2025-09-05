import { Request, Response, NextFunction } from 'express';
import { ILogger } from '@woodie/application/common/interfaces/ILogger';
import { AuthorizationService, AuthContext, User } from './AuthorizationService';
import { DataMaskingService } from './DataMaskingService';
export interface SecurityConfig {
    enableRateLimiting: boolean;
    rateLimitWindowMs: number;
    rateLimitMaxRequests: number;
    enableCSRFProtection: boolean;
    enableCORS: boolean;
    allowedOrigins: string[];
    enableAuditLogging: boolean;
    enableDataMasking: boolean;
    sessionTimeoutMs: number;
    maxLoginAttempts: number;
    lockoutDurationMs: number;
}
export interface SecurityRequest extends Request {
    user?: User;
    sessionId?: string;
    authContext?: AuthContext;
    securityMetadata?: {
        ipAddress: string;
        userAgent: string;
        requestId: string;
        timestamp: Date;
        rateLimitInfo?: {
            remaining: number;
            resetTime: Date;
        };
    };
}
export interface RateLimitInfo {
    identifier: string;
    count: number;
    resetTime: Date;
    isBlocked: boolean;
}
export declare class SecurityMiddleware {
    private readonly authorizationService;
    private readonly dataMaskingService;
    private readonly logger;
    private readonly config;
    private readonly rateLimitStore;
    private readonly loginAttempts;
    constructor(authorizationService: AuthorizationService, dataMaskingService: DataMaskingService, logger: ILogger, config?: Partial<SecurityConfig>);
    securityMiddleware(): (req: SecurityRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    requireTeacherAuth(resource?: string, action?: string): (req: SecurityRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    requireStudentAuth(action?: string): (req: SecurityRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    requirePermission(resource: string, action: string): (req: SecurityRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    dataMaskingMiddleware(policyName?: string): (req: SecurityRequest, res: Response, next: NextFunction) => Promise<void>;
    loginAttemptLimiter(): (req: SecurityRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    auditLoggingMiddleware(): (req: SecurityRequest, res: Response, next: NextFunction) => void;
    private setSecurityMetadata;
    private checkRateLimit;
    private checkCORS;
    private checkCSRF;
    private validateSession;
    private recordFailedLogin;
    private handleRateLimitExceeded;
    private handleCORSViolation;
    private handleCSRFViolation;
    private handleInvalidSession;
    private handleAuthorizationFailure;
    private generateRequestId;
    private startCleanupTimer;
}
//# sourceMappingURL=SecurityMiddleware.d.ts.map