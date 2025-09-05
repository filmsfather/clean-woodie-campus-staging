import { randomUUID } from 'crypto';
export class LoggingUtils {
    /**
     * 상관관계 ID 생성
     */
    static generateCorrelationId() {
        return randomUUID();
    }
    /**
     * 요청 ID 생성
     */
    static generateRequestId() {
        return randomUUID();
    }
    /**
     * 에러를 로그 컨텍스트로 변환
     */
    static errorToContext(error) {
        return {
            errorName: error.name,
            errorMessage: error.message,
            errorStack: error.stack,
            ...(error.cause && typeof error.cause === 'object' ? error.cause : { errorCause: error.cause })
        };
    }
    /**
     * HTTP 요청 정보를 로그 컨텍스트로 변환
     */
    static requestToContext(req) {
        return {
            method: req.method,
            url: req.url,
            userAgent: req.headers?.['user-agent'],
            ip: req.ip || req.connection?.remoteAddress,
            ...(req.user && { userId: req.user.id })
        };
    }
    /**
     * 성능 메트릭을 로그 컨텍스트로 변환
     */
    static performanceToContext(startTime, endTime) {
        const end = endTime || Date.now();
        return {
            startTime,
            endTime: end,
            duration: end - startTime,
            durationMs: `${end - startTime}ms`
        };
    }
    /**
     * 데이터베이스 쿼리 정보를 로그 컨텍스트로 변환
     */
    static queryToContext(query, params, duration) {
        const context = {
            query: query.replace(/\s+/g, ' ').trim(),
            paramCount: params?.length || 0
        };
        if (duration !== undefined) {
            context.queryDuration = duration;
            context.queryDurationMs = `${duration}ms`;
        }
        // 파라미터 로깅 (민감한 정보 마스킹)
        if (params && params.length > 0) {
            context.params = params.map(param => typeof param === 'string' && this.isSensitiveData(param)
                ? this.maskSensitiveData(param)
                : param);
        }
        return context;
    }
    /**
     * API 응답을 로그 컨텍스트로 변환
     */
    static responseToContext(statusCode, responseTime, responseSize) {
        const context = {
            statusCode,
            statusClass: Math.floor(statusCode / 100) + 'xx'
        };
        if (responseTime !== undefined) {
            context.responseTime = responseTime;
            context.responseTimeMs = `${responseTime}ms`;
        }
        if (responseSize !== undefined) {
            context.responseSize = responseSize;
            context.responseSizeKb = `${(responseSize / 1024).toFixed(2)}KB`;
        }
        return context;
    }
    /**
     * 민감한 데이터 감지
     */
    static isSensitiveData(data) {
        const sensitivePatterns = [
            /password/i,
            /token/i,
            /secret/i,
            /key/i,
            /auth/i,
            /credential/i,
            // 이메일
            /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
            // 신용카드 번호 패턴
            /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/,
            // 주민등록번호 패턴 (한국)
            /\b\d{6}[-]?\d{7}\b/
        ];
        return sensitivePatterns.some(pattern => pattern.test(data));
    }
    /**
     * 민감한 데이터 마스킹
     */
    static maskSensitiveData(data) {
        if (data.length <= 4) {
            return '***';
        }
        const visibleLength = Math.min(2, Math.floor(data.length * 0.2));
        const prefix = data.substring(0, visibleLength);
        const suffix = data.substring(data.length - visibleLength);
        const maskLength = data.length - (visibleLength * 2);
        return `${prefix}${'*'.repeat(maskLength)}${suffix}`;
    }
    /**
     * 메타데이터 빌더
     */
    static buildMetadata(options) {
        const metadata = {
            timestamp: new Date()
        };
        if (options.correlationId)
            metadata.correlationId = options.correlationId;
        if (options.userId)
            metadata.userId = options.userId;
        if (options.sessionId)
            metadata.sessionId = options.sessionId;
        if (options.requestId)
            metadata.requestId = options.requestId;
        if (options.operation)
            metadata.operation = options.operation;
        if (options.duration !== undefined) {
            metadata.duration = options.duration;
        }
        else if (options.startTime && options.endTime) {
            metadata.duration = options.endTime - options.startTime;
        }
        return metadata;
    }
    /**
     * 함수 실행 시간을 측정하고 로깅하는 데코레이터
     */
    static logExecutionTime(target, operation, logger) {
        return ((...args) => {
            const startTime = Date.now();
            const correlationId = this.generateCorrelationId();
            logger.info(`Starting ${operation}`, { args: args.length }, {
                correlationId,
                operation,
                startTime
            });
            try {
                const result = target(...args);
                // Promise인 경우
                if (result && typeof result.then === 'function') {
                    return result
                        .then((value) => {
                        const duration = Date.now() - startTime;
                        logger.info(`Completed ${operation}`, { success: true }, {
                            correlationId,
                            operation,
                            duration
                        });
                        return value;
                    })
                        .catch((error) => {
                        const duration = Date.now() - startTime;
                        logger.error(`Failed ${operation}`, this.errorToContext(error), {
                            correlationId,
                            operation,
                            duration
                        });
                        throw error;
                    });
                }
                // 동기 함수인 경우
                const duration = Date.now() - startTime;
                logger.info(`Completed ${operation}`, { success: true }, {
                    correlationId,
                    operation,
                    duration
                });
                return result;
            }
            catch (error) {
                const duration = Date.now() - startTime;
                logger.error(`Failed ${operation}`, this.errorToContext(error), {
                    correlationId,
                    operation,
                    duration
                });
                throw error;
            }
        });
    }
}
//# sourceMappingURL=LoggingUtils.js.map