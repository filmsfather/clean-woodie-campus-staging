// 구조화된 로깅 인터페이스

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

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  TRACE = 'trace'
}

export interface ILogger {
  error(message: string, context?: LogContext, metadata?: LogMetadata): void;
  warn(message: string, context?: LogContext, metadata?: LogMetadata): void;
  info(message: string, context?: LogContext, metadata?: LogMetadata): void;
  debug(message: string, context?: LogContext, metadata?: LogMetadata): void;
  trace(message: string, context?: LogContext, metadata?: LogMetadata): void;
  
  // 성능 로깅
  time(label: string): void;
  timeEnd(label: string, context?: LogContext): void;
  
  // 구조화된 로깅
  log(level: LogLevel, message: string, context?: LogContext, metadata?: LogMetadata): void;
  
  // 자식 로거 생성 (context 상속)
  child(context: LogContext): ILogger;
}