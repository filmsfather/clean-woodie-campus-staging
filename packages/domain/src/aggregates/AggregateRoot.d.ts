import { Entity } from '../entities/Entity';
import { DomainEvent } from '../events/DomainEvent';
export declare abstract class AggregateRoot<T> extends Entity<T> {
    private _domainEvents;
    get domainEvents(): readonly DomainEvent[];
    protected addDomainEvent(domainEvent: DomainEvent): void;
    clearEvents(): void;
    markEventsForDispatch(): void;
    getUncommittedEvents(): readonly DomainEvent[];
    markEventsAsCommitted(): void;
}
//# sourceMappingURL=AggregateRoot.d.ts.map