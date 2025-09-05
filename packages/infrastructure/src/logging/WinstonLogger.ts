import winston from 'winston';
import { 
  ILogger, 
  LogLevel, 
  LogContext, 
  LogMetadata 
} from '@woodie/application/common/interfaces/ILogger';

export interface WinstonLoggerConfig {
  level?: string;
  format?: winston.Logform.Format;
  transports?: winston.transport[];
  defaultMeta?: Record<string, any>;
  exitOnError?: boolean;
  silent?: boolean;
}

export class WinstonLogger implements ILogger {
  private readonly winston: winston.Logger;
  private readonly timers = new Map<string, number>();
  private readonly context: LogContext;

  constructor(config?: WinstonLoggerConfig, parentContext?: LogContext) {
    this.context = parentContext || {};
    
    const defaultConfig: WinstonLoggerConfig = {
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
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
      mergedConfig.transports!.push(
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          format: winston.format.json()
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
          format: winston.format.json()
        })
      );
    }

    this.winston = winston.createLogger(mergedConfig);
  }

  error(message: string, context?: LogContext, metadata?: LogMetadata): void {
    this.log(LogLevel.ERROR, message, context, metadata);
  }

  warn(message: string, context?: LogContext, metadata?: LogMetadata): void {
    this.log(LogLevel.WARN, message, context, metadata);
  }

  info(message: string, context?: LogContext, metadata?: LogMetadata): void {
    this.log(LogLevel.INFO, message, context, metadata);
  }

  debug(message: string, context?: LogContext, metadata?: LogMetadata): void {
    this.log(LogLevel.DEBUG, message, context, metadata);
  }

  trace(message: string, context?: LogContext, metadata?: LogMetadata): void {
    this.log(LogLevel.TRACE, message, context, metadata);
  }

  time(label: string): void {
    this.timers.set(label, Date.now());
  }

  timeEnd(label: string, context?: LogContext): void {
    const startTime = this.timers.get(label);
    if (startTime) {
      const duration = Date.now() - startTime;
      this.timers.delete(label);
      
      this.info(`Timer ${label}`, context, { duration });
    }
  }

  log(level: LogLevel, message: string, context?: LogContext, metadata?: LogMetadata): void {
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
      if ((logData as any)[key] === undefined) {
        delete (logData as any)[key];
      }
    });

    this.winston.log(level, logData);
  }

  child(context: LogContext): ILogger {
    const childContext = {
      ...this.context,
      ...context
    };
    
    return new WinstonLogger(undefined, childContext);
  }

  // 성능 모니터링을 위한 메서드
  profile(id: string): void {
    this.winston.profile(id);
  }

  startTimer(): void {
    this.winston.startTimer();
  }

  // Winston 인스턴스에 직접 접근 (필요시)
  getWinstonInstance(): winston.Logger {
    return this.winston;
  }

  // 로그 레벨 동적 변경
  setLevel(level: string): void {
    this.winston.level = level;
  }

  // Transport 추가
  addTransport(transport: winston.transport): void {
    this.winston.add(transport);
  }

  // Transport 제거
  removeTransport(transport: winston.transport): void {
    this.winston.remove(transport);
  }
}