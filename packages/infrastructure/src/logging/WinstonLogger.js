import winston from 'winston';
import { LogLevel } from '@woodie/application/common/interfaces/ILogger';
export class WinstonLogger {
    winston;
    timers = new Map();
    context;
    constructor(config, parentContext) {
        this.context = parentContext || {};
        const defaultConfig = {
            level: process.env.LOG_LEVEL || 'info',
            format: winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json()),
            transports: [
                new winston.transports.Console({
                    format: winston.format.combine(winston.format.colorize(), winston.format.simple())
                })
            ],
            exitOnError: false
        };
        // 설정 병합
        const mergedConfig = {
            ...defaultConfig,
            ...config,
            transports: config?.transports || defaultConfig.transports
        };
        // 파일 로깅 추가 (프로덕션 환경)
        if (process.env.NODE_ENV === 'production') {
            mergedConfig.transports.push(new winston.transports.File({
                filename: 'logs/error.log',
                level: 'error',
                format: winston.format.json()
            }), new winston.transports.File({
                filename: 'logs/combined.log',
                format: winston.format.json()
            }));
        }
        this.winston = winston.createLogger(mergedConfig);
    }
    error(message, context, metadata) {
        this.log(LogLevel.ERROR, message, context, metadata);
    }
    warn(message, context, metadata) {
        this.log(LogLevel.WARN, message, context, metadata);
    }
    info(message, context, metadata) {
        this.log(LogLevel.INFO, message, context, metadata);
    }
    debug(message, context, metadata) {
        this.log(LogLevel.DEBUG, message, context, metadata);
    }
    trace(message, context, metadata) {
        this.log(LogLevel.TRACE, message, context, metadata);
    }
    time(label) {
        this.timers.set(label, Date.now());
    }
    timeEnd(label, context) {
        const startTime = this.timers.get(label);
        if (startTime) {
            const duration = Date.now() - startTime;
            this.timers.delete(label);
            this.info(`Timer ${label}`, context, { duration });
        }
    }
    log(level, message, context, metadata) {
        const logData = {
            message,
            level,
            timestamp: metadata?.timestamp || new Date(),
            correlationId: metadata?.correlationId,
            userId: metadata?.userId,
            sessionId: metadata?.sessionId,
            requestId: metadata?.requestId,
            operation: metadata?.operation,
            duration: metadata?.duration,
            ...this.context,
            ...context
        };
        // undefined 값 제거
        Object.keys(logData).forEach(key => {
            if (logData[key] === undefined) {
                delete logData[key];
            }
        });
        this.winston.log(level, logData);
    }
    child(context) {
        const childContext = {
            ...this.context,
            ...context
        };
        return new WinstonLogger(undefined, childContext);
    }
    // 성능 모니터링을 위한 메서드
    profile(id) {
        this.winston.profile(id);
    }
    startTimer() {
        this.winston.startTimer();
    }
    // Winston 인스턴스에 직접 접근 (필요시)
    getWinstonInstance() {
        return this.winston;
    }
    // 로그 레벨 동적 변경
    setLevel(level) {
        this.winston.level = level;
    }
    // Transport 추가
    addTransport(transport) {
        this.winston.add(transport);
    }
    // Transport 제거
    removeTransport(transport) {
        this.winston.remove(transport);
    }
}
//# sourceMappingURL=WinstonLogger.js.map