import { ILogger, LogLevel, LogContext, LogMetadata } from '@woodie/application/common/interfaces/ILogger';
export declare class ConsoleLogger implements ILogger {
    private readonly timers;
    private readonly context;
    private readonly logLevel;
    constructor(logLevel?: LogLevel, parentContext?: LogContext);
    error(message: string, context?: LogContext, metadata?: LogMetadata): void;
    warn(message: string, context?: LogContext, metadata?: LogMetadata): void;
    info(message: string, context?: LogContext, metadata?: LogMetadata): void;
    debug(message: string, context?: LogContext, metadata?: LogMetadata): void;
    trace(message: string, context?: LogContext, metadata?: LogMetadata): void;
    time(label: string): void;
    timeEnd(label: string, context?: LogContext): void;
    log(level: LogLevel, message: string, context?: LogContext, metadata?: LogMetadata): void;
    child(context: LogContext): ILogger;
    private shouldLog;
    private colorizeLevel;
    private formatMessage;
    private extractMetadata;
}
//# sourceMappingURL=ConsoleLogger.d.ts.map