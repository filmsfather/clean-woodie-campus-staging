import { UniqueEntityID } from '@woodie/domain/common/Identifier';
export interface IDomainEvent {
    eventId: UniqueEntityID;
    aggregateId: UniqueEntityID;
    eventType: string;
    eventVersion: number;
    occurredOn: Date;
    correlationId?: string;
    causationId?: string;
    metadata?: Record<string, any>;
}
export interface IDomainEventHandler<T extends IDomainEvent> {
    eventType: string;
    handle(event: T): Promise<void>;
}
export interface IEventDispatcher {
    register<T extends IDomainEvent>(eventType: string, handler: IDomainEventHandler<T>): void;
    dispatch(event: IDomainEvent): Promise<void>;
    dispatchAll(events: IDomainEvent[]): Promise<void>;
    markForDispatch(event: IDomainEvent): void;
    clearMarkedEvents(): void;
    dispatchMarkedEvents(): Promise<void>;
}
export interface IEventStore {
    saveEvent(event: IDomainEvent): Promise<void>;
    saveEvents(events: IDomainEvent[]): Promise<void>;
    getEvents(aggregateId: UniqueEntityID, fromVersion?: number): Promise<IDomainEvent[]>;
    getAllEvents(fromEventId?: UniqueEntityID, limit?: number): Promise<IDomainEvent[]>;
}
export interface IEventBus {
    publish(event: IDomainEvent): Promise<void>;
    publishAll(events: IDomainEvent[]): Promise<void>;
    subscribe<T extends IDomainEvent>(eventType: string, handler: IDomainEventHandler<T>): void;
    unsubscribe(eventType: string, handler: IDomainEventHandler<any>): void;
}
export declare abstract class DomainEvent implements IDomainEvent {
    readonly eventId: UniqueEntityID;
    readonly aggregateId: UniqueEntityID;
    readonly eventType: string;
    readonly eventVersion: number;
    readonly occurredOn: Date;
    readonly correlationId?: string;
    readonly causationId?: string;
    readonly metadata?: Record<string, any>;
    constructor(aggregateId: UniqueEntityID, eventType: string, eventVersion?: number, correlationId?: string, causationId?: string, metadata?: Record<string, any>);
    abstract getPayload(): Record<string, any>;
    toJSON(): Record<string, any>;
}
//# sourceMappingURL=IDomainEvent.d.ts.map