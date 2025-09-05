export interface ILogger {
    debug(message: string, meta?: any): void;
    info(message: string, meta?: any): void;
    warn(message: string, meta?: any): void;
    error(message: string, meta?: any): void;
    log(level: 'debug' | 'info' | 'warn' | 'error', message: string, meta?: any): void;
}
//# sourceMappingURL=ILogger.d.ts.map