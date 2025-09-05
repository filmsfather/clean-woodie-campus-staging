export interface LogContext {
    [key: string]: any;
}
export interface LogMetadata {
    timestamp?: Date;
    correlationId?: string;
    userId?: string;
    sessionId?: string;
    requestId?: string;
    operation?: string;
    duration?: number;
}
export declare enum LogLevel {
    ERROR = "error",
    WARN = "warn",
    INFO = "info",
    DEBUG = "debug",
    TRACE = "trace"
}
export interface ILogger {
    error(message: string, context?: LogContext, metadata?: LogMetadata): void;
    warn(message: string, context?: LogContext, metadata?: LogMetadata): void;
    info(message: string, context?: LogContext, metadata?: LogMetadata): void;
    debug(message: string, context?: LogContext, metadata?: LogMetadata): void;
    trace(message: string, context?: LogContext, metadata?: LogMetadata): void;
    time(label: string): void;
    timeEnd(label: string, context?: LogContext): void;
    log(level: LogLevel, message: string, context?: LogContext, metadata?: LogMetadata): void;
    child(context: LogContext): ILogger;
}
//# sourceMappingURL=ILogger.d.ts.map