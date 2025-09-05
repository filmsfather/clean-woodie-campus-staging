export class EventDispatcher {
    handlers = new Map();
    markedEvents = [];
    failedEvents = [];
    eventQueue = [];
    deadLetterQueue = [];
    metrics;
    logger;
    config;
    isProcessing = false;
    constructor(logger, config = {}) {
        this.logger = logger;
        this.config = {
            enableRetry: true,
            maxRetryAttempts: 3,
            retryDelay: 1000,
            enableDeadLetterQueue: true,
            enableEventOrdering: false,
            batchSize: 10,
            enableMetrics: true,
            ...config
        };
        this.metrics = {
            totalDispatched: 0,
            totalFailed: 0,
            totalRetries: 0,
            handlerMetrics: new Map()
        };
    }
    register(eventType, handler) {
        if (!this.handlers.has(eventType)) {
            this.handlers.set(eventType, []);
        }
        const handlers = this.handlers.get(eventType);
        // 중복 등록 방지
        if (!handlers.includes(handler)) {
            handlers.push(handler);
            this.logger.info('Event handler registered', {
                eventType,
                handlerName: handler.constructor.name,
                totalHandlers: handlers.length
            });
        }
        else {
            this.logger.warn('Attempted to register duplicate handler', {
                eventType,
                handlerName: handler.constructor.name
            });
        }
    }
    unregister(eventType, handler) {
        const handlers = this.handlers.get(eventType);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
                this.logger.info('Event handler unregistered', {
                    eventType,
                    handlerName: handler.constructor.name,
                    remainingHandlers: handlers.length
                });
                if (handlers.length === 0) {
                    this.handlers.delete(eventType);
                }
            }
        }
    }
    async dispatch(event) {
        if (this.config.enableEventOrdering) {
            this.eventQueue.push(event);
            await this.processEventQueue();
        }
        else {
            await this.dispatchEvent(event);
        }
    }
    async dispatchAll(events) {
        const correlationId = events[0]?.correlationId || 'batch';
        try {
            this.logger.info('Dispatching event batch', {
                eventCount: events.length,
                correlationId
            });
            if (this.config.enableEventOrdering) {
                this.eventQueue.push(...events);
                await this.processEventQueue();
            }
            else {
                // 병렬 처리
                const dispatchPromises = events.map(event => this.dispatchEvent(event));
                await Promise.allSettled(dispatchPromises);
            }
            this.logger.info('Event batch dispatch completed', {
                eventCount: events.length,
                correlationId
            });
        }
        catch (error) {
            this.logger.error('Event batch dispatch failed', {
                error: error instanceof Error ? error.message : String(error),
                eventCount: events.length,
                correlationId
            });
            throw error;
        }
    }
    markForDispatch(event) {
        this.markedEvents.push(event);
        this.logger.debug('Event marked for dispatch', {
            eventType: event.eventType,
            eventId: event.eventId.toString(),
            aggregateId: event.aggregateId.toString(),
            markedCount: this.markedEvents.length
        });
    }
    clearMarkedEvents() {
        const clearedCount = this.markedEvents.length;
        this.markedEvents.length = 0;
        if (clearedCount > 0) {
            this.logger.info('Marked events cleared', {
                clearedCount
            });
        }
    }
    async dispatchMarkedEvents() {
        if (this.markedEvents.length === 0) {
            return;
        }
        const eventsToDispatch = [...this.markedEvents];
        this.clearMarkedEvents();
        this.logger.info('Dispatching marked events', {
            eventCount: eventsToDispatch.length
        });
        try {
            await this.dispatchAll(eventsToDispatch);
        }
        catch (error) {
            this.logger.error('Failed to dispatch marked events', {
                error: error instanceof Error ? error.message : String(error),
                eventCount: eventsToDispatch.length
            });
            // 실패한 이벤트들을 다시 마킹
            this.markedEvents.unshift(...eventsToDispatch);
            throw error;
        }
    }
    // 재시도 처리
    async retryFailedEvents() {
        if (this.failedEvents.length === 0) {
            return;
        }
        this.logger.info('Retrying failed events', {
            failedEventCount: this.failedEvents.length
        });
        const eventsToRetry = [...this.failedEvents];
        this.failedEvents.length = 0;
        for (const failedEvent of eventsToRetry) {
            if (failedEvent.attempts < this.config.maxRetryAttempts) {
                try {
                    await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
                    await this.dispatchEvent(failedEvent.event);
                    this.metrics.totalRetries++;
                    this.logger.info('Failed event retry succeeded', {
                        eventType: failedEvent.event.eventType,
                        eventId: failedEvent.event.eventId.toString(),
                        attemptNumber: failedEvent.attempts + 1
                    });
                }
                catch (error) {
                    failedEvent.attempts++;
                    failedEvent.error = error instanceof Error ? error : new Error(String(error));
                    if (failedEvent.attempts >= this.config.maxRetryAttempts) {
                        await this.handleDeadLetter(failedEvent.event, failedEvent.error);
                    }
                    else {
                        this.failedEvents.push(failedEvent);
                    }
                }
            }
        }
    }
    // 메트릭스 조회
    getMetrics() {
        return {
            totalDispatched: this.metrics.totalDispatched,
            totalFailed: this.metrics.totalFailed,
            totalRetries: this.metrics.totalRetries,
            handlerMetrics: new Map(this.metrics.handlerMetrics)
        };
    }
    // 등록된 핸들러 조회
    getRegisteredHandlers() {
        const result = new Map();
        for (const [eventType, handlers] of this.handlers) {
            result.set(eventType, handlers.map(h => h.constructor.name));
        }
        return result;
    }
    // 실패한 이벤트 조회
    getFailedEvents() {
        return [...this.failedEvents];
    }
    // Dead Letter Queue 관리 메서드들
    getDeadLetterEvents() {
        return [...this.deadLetterQueue];
    }
    async reprocessDeadLetterEvent(eventId) {
        const deadLetterIndex = this.deadLetterQueue.findIndex(item => item.eventId === eventId && !item.processed);
        if (deadLetterIndex === -1) {
            this.logger.warn('Dead letter event not found or already processed', { eventId });
            return false;
        }
        const deadLetter = this.deadLetterQueue[deadLetterIndex];
        try {
            const event = JSON.parse(deadLetter.eventData);
            await this.dispatchEvent(event);
            deadLetter.processed = true;
            this.logger.info('Dead letter event reprocessed successfully', { eventId });
            return true;
        }
        catch (error) {
            this.logger.error('Failed to reprocess dead letter event', {
                eventId,
                error: error instanceof Error ? error.message : String(error)
            });
            return false;
        }
    }
    clearProcessedDeadLetters() {
        const initialLength = this.deadLetterQueue.length;
        this.deadLetterQueue.splice(0, this.deadLetterQueue.length, ...this.deadLetterQueue.filter(item => !item.processed));
        const removedCount = initialLength - this.deadLetterQueue.length;
        if (removedCount > 0) {
            this.logger.info('Cleared processed dead letters', { removedCount });
        }
        return removedCount;
    }
    async dispatchEvent(event) {
        const startTime = Date.now();
        const handlers = this.handlers.get(event.eventType) || [];
        if (handlers.length === 0) {
            this.logger.debug('No handlers registered for event type', {
                eventType: event.eventType,
                eventId: event.eventId.toString()
            });
            return;
        }
        this.logger.info('Dispatching event', {
            eventType: event.eventType,
            eventId: event.eventId.toString(),
            aggregateId: event.aggregateId.toString(),
            handlerCount: handlers.length,
            correlationId: event.correlationId
        });
        const handlerPromises = handlers.map(handler => this.executeHandler(handler, event, startTime));
        try {
            await Promise.allSettled(handlerPromises);
            this.metrics.totalDispatched++;
            this.logger.info('Event dispatch completed', {
                eventType: event.eventType,
                eventId: event.eventId.toString(),
                handlerCount: handlers.length,
                duration: Date.now() - startTime
            });
        }
        catch (error) {
            this.metrics.totalFailed++;
            if (this.config.enableRetry) {
                this.failedEvents.push({
                    event,
                    error: error instanceof Error ? error : new Error(String(error)),
                    attempts: 0
                });
            }
            this.logger.error('Event dispatch failed', {
                eventType: event.eventType,
                eventId: event.eventId.toString(),
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }
    async executeHandler(handler, event, startTime) {
        const handlerStartTime = Date.now();
        const handlerName = handler.constructor.name;
        try {
            await handler.handle(event);
            // 메트릭스 업데이트
            if (this.config.enableMetrics) {
                this.updateHandlerMetrics(handlerName, Date.now() - handlerStartTime, false);
            }
            this.logger.debug('Event handler executed successfully', {
                eventType: event.eventType,
                handlerName,
                duration: Date.now() - handlerStartTime
            });
        }
        catch (error) {
            // 메트릭스 업데이트
            if (this.config.enableMetrics) {
                this.updateHandlerMetrics(handlerName, Date.now() - handlerStartTime, true);
            }
            this.logger.error('Event handler execution failed', {
                eventType: event.eventType,
                handlerName,
                error: error instanceof Error ? error.message : String(error),
                eventId: event.eventId.toString()
            });
            throw error;
        }
    }
    async processEventQueue() {
        if (this.isProcessing || this.eventQueue.length === 0) {
            return;
        }
        this.isProcessing = true;
        try {
            while (this.eventQueue.length > 0) {
                const batch = this.eventQueue.splice(0, this.config.batchSize);
                for (const event of batch) {
                    await this.dispatchEvent(event);
                }
            }
        }
        finally {
            this.isProcessing = false;
        }
    }
    updateHandlerMetrics(handlerName, executionTime, failed) {
        if (!this.metrics.handlerMetrics.has(handlerName)) {
            this.metrics.handlerMetrics.set(handlerName, {
                executed: 0,
                failed: 0,
                averageExecutionTime: 0
            });
        }
        const metrics = this.metrics.handlerMetrics.get(handlerName);
        metrics.executed++;
        if (failed) {
            metrics.failed++;
        }
        // 이동 평균 계산
        metrics.averageExecutionTime =
            (metrics.averageExecutionTime * (metrics.executed - 1) + executionTime) / metrics.executed;
    }
    async handleDeadLetter(event, error) {
        if (!this.config.enableDeadLetterQueue) {
            return;
        }
        const deadLetterData = {
            eventId: event.eventId.toString(),
            eventType: event.eventType,
            aggregateId: event.aggregateId.toString(),
            correlationId: event.correlationId,
            eventData: JSON.stringify(event),
            errorMessage: error.message,
            errorStack: error.stack,
            maxAttemptsReached: this.config.maxRetryAttempts,
            createdAt: new Date().toISOString(),
            retryCount: this.config.maxRetryAttempts,
            timestamp: Date.now(),
            processed: false
        };
        this.logger.error('Event moved to dead letter queue', deadLetterData);
        try {
            // 메모리 기반 Dead Letter Queue 저장
            this.deadLetterQueue.push(deadLetterData);
            // 큐 크기 제한 (메모리 누수 방지)
            if (this.deadLetterQueue.length > 1000) {
                this.deadLetterQueue.shift();
            }
            // 외부 시스템에 저장 (확장 가능)
            await this.persistDeadLetterEvent(deadLetterData);
            this.logger.info('Dead letter event persisted', {
                eventId: event.eventId.toString(),
                queueSize: this.deadLetterQueue.length
            });
        }
        catch (persistError) {
            this.logger.error('Failed to persist dead letter event', {
                eventId: event.eventId.toString(),
                persistError: persistError instanceof Error ? persistError.message : String(persistError),
                originalError: error.message
            });
        }
    }
    async persistDeadLetterEvent(deadLetterData) {
        // 환경에 따른 저장 방식 선택
        const persistenceMode = process.env.DEAD_LETTER_PERSISTENCE || 'memory';
        switch (persistenceMode) {
            case 'database':
                await this.persistToDatabase(deadLetterData);
                break;
            case 'file':
                await this.persistToFile(deadLetterData);
                break;
            case 'external':
                await this.persistToExternalQueue(deadLetterData);
                break;
            case 'memory':
            default:
                // 이미 메모리에 저장됨
                break;
        }
    }
    async persistToDatabase(deadLetterData) {
        // 데이터베이스 저장 로직 (Supabase 등)
        this.logger.info('Persisting dead letter to database', {
            eventId: deadLetterData.eventId
        });
    }
    async persistToFile(deadLetterData) {
        const fs = await import('fs/promises');
        const path = await import('path');
        try {
            const logDir = path.join(process.cwd(), 'logs', 'dead-letters');
            await fs.mkdir(logDir, { recursive: true });
            const fileName = `dead-letter-${new Date().toISOString().split('T')[0]}.jsonl`;
            const filePath = path.join(logDir, fileName);
            await fs.appendFile(filePath, JSON.stringify(deadLetterData) + '\n');
            this.logger.info('Dead letter persisted to file', {
                eventId: deadLetterData.eventId,
                filePath
            });
        }
        catch (error) {
            this.logger.error('Failed to persist dead letter to file', {
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }
    async persistToExternalQueue(deadLetterData) {
        // 외부 큐 시스템 (Redis, RabbitMQ, AWS SQS 등)
        this.logger.info('Persisting dead letter to external queue', {
            eventId: deadLetterData.eventId
        });
    }
}
//# sourceMappingURL=EventDispatcher.js.map