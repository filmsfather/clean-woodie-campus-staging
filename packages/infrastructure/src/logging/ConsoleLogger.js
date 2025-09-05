import { LogLevel } from '@woodie/application/common/interfaces/ILogger';
export class ConsoleLogger {
    timers = new Map();
    context;
    logLevel;
    constructor(logLevel = LogLevel.INFO, parentContext) {
        this.logLevel = logLevel;
        this.context = parentContext || {};
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
        console.time(label);
    }
    timeEnd(label, context) {
        const startTime = this.timers.get(label);
        if (startTime) {
            const duration = Date.now() - startTime;
            this.timers.delete(label);
            console.timeEnd(label);
            this.info(`Timer ${label} completed`, context, { duration });
        }
    }
    log(level, message, context, metadata) {
        if (!this.shouldLog(level)) {
            return;
        }
        const timestamp = metadata?.timestamp || new Date();
        const logData = {
            timestamp: timestamp.toISOString(),
            level,
            message,
            ...this.context,
            ...context,
            ...this.extractMetadata(metadata)
        };
        const coloredLevel = this.colorizeLevel(level);
        const formattedMessage = this.formatMessage(coloredLevel, message, logData);
        switch (level) {
            case LogLevel.ERROR:
                console.error(formattedMessage);
                break;
            case LogLevel.WARN:
                console.warn(formattedMessage);
                break;
            case LogLevel.DEBUG:
                console.debug(formattedMessage);
                break;
            case LogLevel.TRACE:
                console.trace(formattedMessage);
                break;
            default:
                console.log(formattedMessage);
        }
    }
    child(context) {
        const childContext = {
            ...this.context,
            ...context
        };
        return new ConsoleLogger(this.logLevel, childContext);
    }
    shouldLog(level) {
        const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG, LogLevel.TRACE];
        const currentLevelIndex = levels.indexOf(this.logLevel);
        const messageLevelIndex = levels.indexOf(level);
        return messageLevelIndex <= currentLevelIndex;
    }
    colorizeLevel(level) {
        const colors = {
            [LogLevel.ERROR]: '\x1b[31m', // Red
            [LogLevel.WARN]: '\x1b[33m', // Yellow
            [LogLevel.INFO]: '\x1b[32m', // Green
            [LogLevel.DEBUG]: '\x1b[36m', // Cyan
            [LogLevel.TRACE]: '\x1b[35m' // Magenta
        };
        const reset = '\x1b[0m';
        const color = colors[level] || '';
        return `${color}${level.toUpperCase()}${reset}`;
    }
    formatMessage(coloredLevel, message, logData) {
        const { timestamp, level, ...rest } = logData;
        const hasContext = Object.keys(rest).length > 0;
        let formatted = `[${timestamp}] ${coloredLevel}: ${message}`;
        if (hasContext) {
            formatted += ` ${JSON.stringify(rest, null, 2)}`;
        }
        return formatted;
    }
    extractMetadata(metadata) {
        if (!metadata)
            return {};
        const extracted = {};
        if (metadata.correlationId)
            extracted.correlationId = metadata.correlationId;
        if (metadata.userId)
            extracted.userId = metadata.userId;
        if (metadata.sessionId)
            extracted.sessionId = metadata.sessionId;
        if (metadata.requestId)
            extracted.requestId = metadata.requestId;
        if (metadata.operation)
            extracted.operation = metadata.operation;
        if (metadata.duration !== undefined)
            extracted.duration = metadata.duration;
        return extracted;
    }
}
//# sourceMappingURL=ConsoleLogger.js.map