import { ILogger, LogLevel } from '@woodie/application/common/interfaces/ILogger';
import { WinstonLoggerConfig } from './WinstonLogger';
export type LoggerType = 'winston' | 'console';
export interface LoggerFactoryConfig {
    type: LoggerType;
    level?: LogLevel;
    winston?: WinstonLoggerConfig;
    enableFileLogging?: boolean;
    logDir?: string;
}
export declare class LoggerFactory {
    private static instance;
    static create(config: LoggerFactoryConfig): ILogger;
    static createFromEnv(): ILogger;
    static getInstance(): ILogger;
    static setInstance(logger: ILogger): void;
    private static createWinstonLogger;
    private static createConsoleLogger;
    static createStructuredLogger(): ILogger;
    static createDevelopmentLogger(): ILogger;
    static createProductionLogger(): ILogger;
}
//# sourceMappingURL=LoggerFactory.d.ts.map