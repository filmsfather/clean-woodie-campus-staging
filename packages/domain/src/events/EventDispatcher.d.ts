import { DomainEvent } from './DomainEvent';
export interface EventHandler<T extends DomainEvent> {
    handle(event: T): Promise<void>;
}
export interface EventDispatcher {
    register<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): void;
    dispatch(event: DomainEvent): Promise<void>;
    dispatchAll(events: DomainEvent[]): Promise<void>;
}
//# sourceMappingURL=EventDispatcher.d.ts.map