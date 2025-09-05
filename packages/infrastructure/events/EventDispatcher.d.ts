import { IDomainEvent, IDomainEventHandler, IEventDispatcher } from '@woodie/application/common/interfaces/IDomainEvent';
import { ILogger } from '@woodie/application/common/interfaces/ILogger';
export interface EventDispatcherConfig {
    enableRetry?: boolean;
    maxRetryAttempts?: number;
    retryDelay?: number;
    enableDeadLetterQueue?: boolean;
    enableEventOrdering?: boolean;
    batchSize?: number;
    enableMetrics?: boolean;
}
export interface EventMetrics {
    totalDispatched: number;
    totalFailed: number;
    totalRetries: number;
    handlerMetrics: Map<string, {
        executed: number;
        failed: number;
        averageExecutionTime: number;
    }>;
}
export interface DeadLetterItem {
    eventId: string;
    eventType: string;
    aggregateId: string;
    correlationId?: string;
    eventData: string;
    errorMessage: string;
    errorStack?: string;
    maxAttemptsReached?: number;
    createdAt: string;
    retryCount?: number;
    timestamp: number;
    processed: boolean;
}
export declare class EventDispatcher implements IEventDispatcher {
    private readonly handlers;
    private readonly markedEvents;
    private readonly failedEvents;
    private readonly eventQueue;
    private readonly deadLetterQueue;
    private readonly metrics;
    private readonly logger;
    private readonly config;
    private isProcessing;
    constructor(logger: ILogger, config?: EventDispatcherConfig);
    register<T extends IDomainEvent>(eventType: string, handler: IDomainEventHandler<T>): void;
    unregister<T extends IDomainEvent>(eventType: string, handler: IDomainEventHandler<T>): void;
    dispatch(event: IDomainEvent): Promise<void>;
    dispatchAll(events: IDomainEvent[]): Promise<void>;
    markForDispatch(event: IDomainEvent): void;
    clearMarkedEvents(): void;
    dispatchMarkedEvents(): Promise<void>;
    retryFailedEvents(): Promise<void>;
    getMetrics(): EventMetrics;
    getRegisteredHandlers(): Map<string, string[]>;
    getFailedEvents(): Array<{
        event: IDomainEvent;
        error: Error;
        attempts: number;
    }>;
    getDeadLetterEvents(): DeadLetterItem[];
    reprocessDeadLetterEvent(eventId: string): Promise<boolean>;
    clearProcessedDeadLetters(): number;
    private dispatchEvent;
    private executeHandler;
    private processEventQueue;
    private updateHandlerMetrics;
    private handleDeadLetter;
    private persistDeadLetterEvent;
    private persistToDatabase;
    private persistToFile;
    private persistToExternalQueue;
}
//# sourceMappingURL=EventDispatcher.d.ts.map