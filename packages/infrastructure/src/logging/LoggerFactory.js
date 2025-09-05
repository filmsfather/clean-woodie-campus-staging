import { LogLevel } from '@woodie/application/common/interfaces/ILogger';
import { WinstonLogger } from './WinstonLogger';
import { ConsoleLogger } from './ConsoleLogger';
import winston from 'winston';
export class LoggerFactory {
    static instance = null;
    static create(config) {
        switch (config.type) {
            case 'winston':
                return this.createWinstonLogger(config);
            case 'console':
                return this.createConsoleLogger(config);
            default:
                throw new Error(`Unsupported logger type: ${config.type}`);
        }
    }
    static createFromEnv() {
        const loggerType = process.env.LOGGER_TYPE || 'console';
        const logLevel = process.env.LOG_LEVEL || LogLevel.INFO;
        const enableFileLogging = process.env.ENABLE_FILE_LOGGING === 'true';
        const logDir = process.env.LOG_DIR || 'logs';
        const config = {
            type: loggerType,
            level: logLevel,
            enableFileLogging,
            logDir
        };
        return this.create(config);
    }
    static getInstance() {
        if (!this.instance) {
            this.instance = this.createFromEnv();
        }
        return this.instance;
    }
    static setInstance(logger) {
        this.instance = logger;
    }
    static createWinstonLogger(config) {
        const winstonConfig = {
            level: config.level || LogLevel.INFO,
            ...config.winston
        };
        // Transport 설정
        const transports = [
            new winston.transports.Console({
                format: winston.format.combine(winston.format.timestamp(), winston.format.colorize(), winston.format.printf(({ timestamp, level, message, ...meta }) => {
                    let log = `[${timestamp}] ${level}: ${message}`;
                    if (Object.keys(meta).length > 0) {
                        log += ` ${JSON.stringify(meta)}`;
                    }
                    return log;
                }))
            })
        ];
        // 파일 로깅 추가
        if (config.enableFileLogging) {
            const logDir = config.logDir || 'logs';
            transports.push(new winston.transports.File({
                filename: `${logDir}/error.log`,
                level: 'error',
                format: winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json())
            }), new winston.transports.File({
                filename: `${logDir}/combined.log`,
                format: winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json())
            }));
        }
        winstonConfig.transports = transports;
        return new WinstonLogger(winstonConfig);
    }
    static createConsoleLogger(config) {
        const logLevel = config.level || LogLevel.INFO;
        return new ConsoleLogger(logLevel);
    }
    // 특수한 목적의 로거들
    static createStructuredLogger() {
        return this.create({
            type: 'winston',
            level: LogLevel.INFO,
            winston: {
                format: winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json())
            }
        });
    }
    static createDevelopmentLogger() {
        return this.create({
            type: 'console',
            level: LogLevel.DEBUG
        });
    }
    static createProductionLogger() {
        return this.create({
            type: 'winston',
            level: LogLevel.INFO,
            enableFileLogging: true,
            logDir: process.env.LOG_DIR || '/var/log/woodie'
        });
    }
}
//# sourceMappingURL=LoggerFactory.js.map