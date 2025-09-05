import { Result } from '@woodie/domain/common/Result';
export class SecurityMiddleware {
    authorizationService;
    dataMaskingService;
    logger;
    config;
    rateLimitStore = new Map();
    loginAttempts = new Map();
    constructor(authorizationService, dataMaskingService, logger, config = {}) {
        this.authorizationService = authorizationService;
        this.dataMaskingService = dataMaskingService;
        this.logger = logger;
        this.config = {
            enableRateLimiting: true,
            rateLimitWindowMs: 900000, // 15분
            rateLimitMaxRequests: 100,
            enableCSRFProtection: true,
            enableCORS: true,
            allowedOrigins: [],
            enableAuditLogging: true,
            enableDataMasking: true,
            sessionTimeoutMs: 3600000, // 1시간
            maxLoginAttempts: 5,
            lockoutDurationMs: 1800000, // 30분
            ...config
        };
        this.startCleanupTimer();
    }
    // 메인 보안 미들웨어
    securityMiddleware() {
        return async (req, res, next) => {
            try {
                // 보안 메타데이터 설정
                this.setSecurityMetadata(req);
                // Rate Limiting 검사
                if (this.config.enableRateLimiting) {
                    const rateLimitResult = this.checkRateLimit(req);
                    if (!rateLimitResult.allowed) {
                        return this.handleRateLimitExceeded(req, res, rateLimitResult);
                    }
                }
                // CORS 검사
                if (this.config.enableCORS) {
                    const corsResult = this.checkCORS(req);
                    if (!corsResult.allowed) {
                        return this.handleCORSViolation(req, res);
                    }
                }
                // CSRF 보호
                if (this.config.enableCSRFProtection && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
                    const csrfResult = this.checkCSRF(req);
                    if (!csrfResult.valid) {
                        return this.handleCSRFViolation(req, res);
                    }
                }
                // 세션 유효성 검사
                const sessionResult = await this.validateSession(req);
                if (sessionResult.isFailure) {
                    return this.handleInvalidSession(req, res, sessionResult.getErrorValue());
                }
                next();
            }
            catch (error) {
                this.logger.error('Security middleware error', {
                    error: error instanceof Error ? error.message : String(error),
                    url: req.url,
                    method: req.method,
                    ip: req.ip
                });
                return res.status(500).json({
                    error: 'Internal security error',
                    requestId: req.securityMetadata?.requestId
                });
            }
        };
    }
    // 교사 권한 검증 미들웨어
    requireTeacherAuth(resource, action = 'read') {
        return async (req, res, next) => {
            try {
                if (!req.user || req.user.role !== 'teacher') {
                    return this.handleAuthorizationFailure(req, res, 'Teacher role required');
                }
                if (resource) {
                    const authResult = await this.authorizationService.authorizeTeacherAccess(req.authContext, req.params.teacherId || req.user.id, action);
                    if (authResult.isFailure) {
                        return this.handleAuthorizationFailure(req, res, authResult.getErrorValue());
                    }
                }
                next();
            }
            catch (error) {
                this.logger.error('Teacher authorization error', {
                    error: error instanceof Error ? error.message : String(error),
                    userId: req.user?.id,
                    resource,
                    action
                });
                return res.status(500).json({ error: 'Authorization check failed' });
            }
        };
    }
    // 학생 권한 검증 미들웨어
    requireStudentAuth(action = 'read') {
        return async (req, res, next) => {
            try {
                if (!req.user || req.user.role !== 'student') {
                    return this.handleAuthorizationFailure(req, res, 'Student role required');
                }
                const authResult = await this.authorizationService.authorizeStudentAccess(req.authContext, req.params.problemId || '', action);
                if (authResult.isFailure) {
                    return this.handleAuthorizationFailure(req, res, authResult.getErrorValue());
                }
                next();
            }
            catch (error) {
                this.logger.error('Student authorization error', {
                    error: error instanceof Error ? error.message : String(error),
                    userId: req.user?.id,
                    action
                });
                return res.status(500).json({ error: 'Authorization check failed' });
            }
        };
    }
    // 리소스별 권한 검증 미들웨어
    requirePermission(resource, action) {
        return async (req, res, next) => {
            try {
                if (!req.authContext) {
                    return this.handleAuthorizationFailure(req, res, 'Authentication required');
                }
                const authResult = await this.authorizationService.authorize(req.authContext, resource, action, req.body // 리소스 데이터
                );
                if (authResult.isFailure) {
                    return this.handleAuthorizationFailure(req, res, authResult.getErrorValue());
                }
                next();
            }
            catch (error) {
                this.logger.error('Permission check error', {
                    error: error instanceof Error ? error.message : String(error),
                    userId: req.user?.id,
                    resource,
                    action
                });
                return res.status(500).json({ error: 'Permission check failed' });
            }
        };
    }
    // 데이터 마스킹 미들웨어 (응답 데이터)
    dataMaskingMiddleware(policyName = 'default') {
        return async (req, res, next) => {
            if (!this.config.enableDataMasking || !req.user) {
                return next();
            }
            // 원본 res.json을 래핑하여 데이터 마스킹 적용
            const originalJson = res.json.bind(res);
            res.json = (data) => {
                try {
                    const maskingContext = {
                        requesterRole: req.user.role,
                        requesterId: req.user.id,
                        dataOwnerId: req.params.ownerId || req.user.id,
                        purpose: `${req.method} ${req.route?.path || req.path}`,
                        classification: 'internal'
                    };
                    // 비동기 마스킹을 동기적으로 처리하거나 스키핑
                    const maskedData = data; // TODO: 동기 마스킹 구현 필요
                    return originalJson(maskedData);
                }
                catch (error) {
                    this.logger.error('Data masking middleware error', {
                        error: error instanceof Error ? error.message : String(error),
                        requestId: req.securityMetadata?.requestId
                    });
                    return originalJson(data);
                }
            };
            next();
        };
    }
    // 로그인 시도 제한 미들웨어
    loginAttemptLimiter() {
        return async (req, res, next) => {
            const identifier = req.body.email || req.ip;
            const attemptInfo = this.loginAttempts.get(identifier);
            if (attemptInfo) {
                // 잠금 시간 확인
                if (attemptInfo.lockedUntil && attemptInfo.lockedUntil > new Date()) {
                    const remainingTime = Math.ceil((attemptInfo.lockedUntil.getTime() - Date.now()) / 1000 / 60);
                    this.logger.warn('Login attempt blocked due to lockout', {
                        identifier,
                        remainingTime,
                        ip: req.ip
                    });
                    return res.status(423).json({
                        error: 'Account temporarily locked',
                        remainingTime: `${remainingTime} minutes`,
                        requestId: req.securityMetadata?.requestId
                    });
                }
                // 잠금 시간이 지났으면 카운트 리셋
                if (attemptInfo.lockedUntil && attemptInfo.lockedUntil <= new Date()) {
                    this.loginAttempts.delete(identifier);
                }
            }
            // 응답 래핑하여 실패 시 카운트 증가
            const originalJson = res.json.bind(res);
            res.json = (data) => {
                if (res.statusCode === 401 || (data && data.error && data.error.includes('login'))) {
                    this.recordFailedLogin(identifier);
                }
                else if (res.statusCode === 200 && data.user) {
                    // 로그인 성공시 카운트 리셋
                    this.loginAttempts.delete(identifier);
                }
                return originalJson(data);
            };
            next();
        };
    }
    // 감사 로깅 미들웨어
    auditLoggingMiddleware() {
        return (req, res, next) => {
            if (!this.config.enableAuditLogging) {
                return next();
            }
            const startTime = Date.now();
            // 응답 완료 시 로깅
            res.on('finish', () => {
                const duration = Date.now() - startTime;
                this.logger.info('API Access Audit', {
                    requestId: req.securityMetadata?.requestId,
                    method: req.method,
                    url: req.url,
                    statusCode: res.statusCode,
                    duration,
                    userId: req.user?.id,
                    userRole: req.user?.role,
                    ipAddress: req.securityMetadata?.ipAddress,
                    userAgent: req.securityMetadata?.userAgent,
                    timestamp: req.securityMetadata?.timestamp
                });
            });
            next();
        };
    }
    setSecurityMetadata(req) {
        req.securityMetadata = {
            ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
            userAgent: req.get('User-Agent') || 'unknown',
            requestId: this.generateRequestId(),
            timestamp: new Date()
        };
    }
    checkRateLimit(req) {
        const identifier = req.user?.id || req.ip || 'anonymous';
        const now = new Date();
        const windowStart = new Date(now.getTime() - this.config.rateLimitWindowMs);
        let rateLimitInfo = this.rateLimitStore.get(identifier);
        if (!rateLimitInfo || rateLimitInfo.resetTime <= now) {
            rateLimitInfo = {
                identifier,
                count: 1,
                resetTime: new Date(now.getTime() + this.config.rateLimitWindowMs),
                isBlocked: false
            };
        }
        else {
            rateLimitInfo.count++;
        }
        if (rateLimitInfo.count > this.config.rateLimitMaxRequests) {
            rateLimitInfo.isBlocked = true;
        }
        this.rateLimitStore.set(identifier, rateLimitInfo);
        const remaining = Math.max(0, this.config.rateLimitMaxRequests - rateLimitInfo.count);
        if (req.securityMetadata) {
            req.securityMetadata.rateLimitInfo = {
                remaining,
                resetTime: rateLimitInfo.resetTime
            };
        }
        return {
            allowed: !rateLimitInfo.isBlocked,
            remaining,
            resetTime: rateLimitInfo.resetTime
        };
    }
    checkCORS(req) {
        const origin = req.get('Origin');
        if (!origin) {
            return { allowed: true }; // Same-origin requests
        }
        if (this.config.allowedOrigins.length === 0) {
            return { allowed: true }; // No restrictions configured
        }
        const allowed = this.config.allowedOrigins.some(allowedOrigin => {
            if (allowedOrigin === '*')
                return true;
            if (allowedOrigin.startsWith('*.')) {
                const domain = allowedOrigin.substring(2);
                return origin.endsWith(domain);
            }
            return origin === allowedOrigin;
        });
        return { allowed };
    }
    checkCSRF(req) {
        const token = req.get('X-CSRF-Token') || req.body._csrf;
        const sessionToken = req.sessionId; // SecurityRequest has sessionId instead of session
        // 실제 구현에서는 보다 강력한 CSRF 토큰 검증
        return { valid: token === sessionToken };
    }
    async validateSession(req) {
        const sessionId = req.get('X-Session-Id') || req.sessionId;
        if (!sessionId) {
            return Result.fail('No session ID provided');
        }
        // 실제 구현에서는 세션 저장소에서 검증
        req.sessionId = sessionId;
        // AuthContext 설정
        if (req.user && req.securityMetadata) {
            req.authContext = {
                user: req.user,
                sessionId,
                requestId: req.securityMetadata.requestId,
                ipAddress: req.securityMetadata.ipAddress,
                userAgent: req.securityMetadata.userAgent,
                timestamp: req.securityMetadata.timestamp
            };
        }
        return Result.ok();
    }
    recordFailedLogin(identifier) {
        const attemptInfo = this.loginAttempts.get(identifier) || { count: 0 };
        attemptInfo.count++;
        if (attemptInfo.count >= this.config.maxLoginAttempts) {
            attemptInfo.lockedUntil = new Date(Date.now() + this.config.lockoutDurationMs);
            this.logger.warn('Account locked due to failed login attempts', {
                identifier,
                attempts: attemptInfo.count,
                lockedUntil: attemptInfo.lockedUntil
            });
        }
        this.loginAttempts.set(identifier, attemptInfo);
    }
    handleRateLimitExceeded(req, res, rateLimitResult) {
        this.logger.warn('Rate limit exceeded', {
            identifier: req.user?.id || req.ip,
            url: req.url,
            resetTime: rateLimitResult.resetTime
        });
        return res.status(429).json({
            error: 'Too many requests',
            remaining: rateLimitResult.remaining,
            resetTime: rateLimitResult.resetTime,
            requestId: req.securityMetadata?.requestId
        });
    }
    handleCORSViolation(req, res) {
        this.logger.warn('CORS violation detected', {
            origin: req.get('Origin'),
            url: req.url,
            method: req.method
        });
        return res.status(403).json({
            error: 'CORS policy violation',
            requestId: req.securityMetadata?.requestId
        });
    }
    handleCSRFViolation(req, res) {
        this.logger.warn('CSRF token validation failed', {
            url: req.url,
            method: req.method,
            userId: req.user?.id
        });
        return res.status(403).json({
            error: 'CSRF token validation failed',
            requestId: req.securityMetadata?.requestId
        });
    }
    handleInvalidSession(req, res, error) {
        this.logger.warn('Invalid session detected', {
            error,
            url: req.url,
            sessionId: req.sessionId
        });
        return res.status(401).json({
            error: 'Invalid session',
            requestId: req.securityMetadata?.requestId
        });
    }
    handleAuthorizationFailure(req, res, error) {
        this.logger.warn('Authorization failed', {
            error,
            userId: req.user?.id,
            userRole: req.user?.role,
            url: req.url,
            method: req.method
        });
        return res.status(403).json({
            error: 'Access denied',
            reason: error,
            requestId: req.securityMetadata?.requestId
        });
    }
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    startCleanupTimer() {
        // 주기적으로 만료된 rate limit 및 login attempt 정보 정리
        setInterval(() => {
            const now = new Date();
            // Rate limit 정리
            for (const [identifier, info] of this.rateLimitStore.entries()) {
                if (info.resetTime <= now) {
                    this.rateLimitStore.delete(identifier);
                }
            }
            // Login attempts 정리
            for (const [identifier, info] of this.loginAttempts.entries()) {
                if (info.lockedUntil && info.lockedUntil <= now) {
                    this.loginAttempts.delete(identifier);
                }
            }
        }, 60000); // 1분마다 정리
    }
}
//# sourceMappingURL=SecurityMiddleware.js.map