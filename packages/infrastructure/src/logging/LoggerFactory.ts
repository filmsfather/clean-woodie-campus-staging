import { ILogger, LogLevel } from '@woodie/application/common/interfaces/ILogger';
import { WinstonLogger, WinstonLoggerConfig } from './WinstonLogger';
import { ConsoleLogger } from './ConsoleLogger';
import winston from 'winston';

export type LoggerType = 'winston' | 'console';

export interface LoggerFactoryConfig {
  type: LoggerType;
  level?: LogLevel;
  winston?: WinstonLoggerConfig;
  enableFileLogging?: boolean;
  logDir?: string;
}

export class LoggerFactory {
  private static instance: ILogger | null = null;

  static create(config: LoggerFactoryConfig): ILogger {
    switch (config.type) {
      case 'winston':
        return this.createWinstonLogger(config);
      case 'console':
        return this.createConsoleLogger(config);
      default:
        throw new Error(`Unsupported logger type: ${config.type}`);
    }
  }

  static createFromEnv(): ILogger {
    const loggerType = (process.env.LOGGER_TYPE as LoggerType) || 'console';
    const logLevel = (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO;
    const enableFileLogging = process.env.ENABLE_FILE_LOGGING === 'true';
    const logDir = process.env.LOG_DIR || 'logs';

    const config: LoggerFactoryConfig = {
      type: loggerType,
      level: logLevel,
      enableFileLogging,
      logDir
    };

    return this.create(config);
  }

  static getInstance(): ILogger {
    if (!this.instance) {
      this.instance = this.createFromEnv();
    }
    return this.instance;
  }

  static setInstance(logger: ILogger): void {
    this.instance = logger;
  }

  private static createWinstonLogger(config: LoggerFactoryConfig): WinstonLogger {
    const winstonConfig: WinstonLoggerConfig = {
      level: config.level || LogLevel.INFO,
      ...config.winston
    };

    // Transport 설정
    const transports: winston.transport[] = [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, ...meta }) => {
            let log = `[${timestamp}] ${level}: ${message}`;
            if (Object.keys(meta).length > 0) {
              log += ` ${JSON.stringify(meta)}`;
            }
            return log;
          })
        )
      })
    ];

    // 파일 로깅 추가
    if (config.enableFileLogging) {
      const logDir = config.logDir || 'logs';
      
      transports.push(
        new winston.transports.File({
          filename: `${logDir}/error.log`,
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json()
          )
        }),
        new winston.transports.File({
          filename: `${logDir}/combined.log`,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json()
          )
        })
      );
    }

    winstonConfig.transports = transports;

    return new WinstonLogger(winstonConfig);
  }

  private static createConsoleLogger(config: LoggerFactoryConfig): ConsoleLogger {
    const logLevel = config.level || LogLevel.INFO;
    return new ConsoleLogger(logLevel);
  }

  // 특수한 목적의 로거들
  static createStructuredLogger(): ILogger {
    return this.create({
      type: 'winston',
      level: LogLevel.INFO,
      winston: {
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json()
        )
      }
    });
  }

  static createDevelopmentLogger(): ILogger {
    return this.create({
      type: 'console',
      level: LogLevel.DEBUG
    });
  }

  static createProductionLogger(): ILogger {
    return this.create({
      type: 'winston',
      level: LogLevel.INFO,
      enableFileLogging: true,
      logDir: process.env.LOG_DIR || '/var/log/woodie'
    });
  }
}