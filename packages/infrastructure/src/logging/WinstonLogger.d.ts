import winston from 'winston';
import { ILogger, LogLevel, LogContext, LogMetadata } from '@woodie/application/common/interfaces/ILogger';
export interface WinstonLoggerConfig {
    level?: string;
    format?: winston.Logform.Format;
    transports?: winston.transport[];
    defaultMeta?: Record<string, any>;
    exitOnError?: boolean;
    silent?: boolean;
}
export declare class WinstonLogger implements ILogger {
    private readonly winston;
    private readonly timers;
    private readonly context;
    constructor(config?: WinstonLoggerConfig, parentContext?: LogContext);
    error(message: string, context?: LogContext, metadata?: LogMetadata): void;
    warn(message: string, context?: LogContext, metadata?: LogMetadata): void;
    info(message: string, context?: LogContext, metadata?: LogMetadata): void;
    debug(message: string, context?: LogContext, metadata?: LogMetadata): void;
    trace(message: string, context?: LogContext, metadata?: LogMetadata): void;
    time(label: string): void;
    timeEnd(label: string, context?: LogContext): void;
    log(level: LogLevel, message: string, context?: LogContext, metadata?: LogMetadata): void;
    child(context: LogContext): ILogger;
    profile(id: string): void;
    startTimer(): void;
    getWinstonInstance(): winston.Logger;
    setLevel(level: string): void;
    addTransport(transport: winston.transport): void;
    removeTransport(transport: winston.transport): void;
}
//# sourceMappingURL=WinstonLogger.d.ts.map