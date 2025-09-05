import { Entity } from '../entities/Entity';
export class AggregateRoot extends Entity {
    _domainEvents = [];
    get domainEvents() {
        return this._domainEvents;
    }
    addDomainEvent(domainEvent) {
        this._domainEvents.push(domainEvent);
    }
    clearEvents() {
        this._domainEvents.length = 0;
    }
    markEventsForDispatch() {
        this._domainEvents.forEach(event => this.addDomainEvent(event));
    }
    getUncommittedEvents() {
        return this._domainEvents;
    }
    markEventsAsCommitted() {
        this.clearEvents();
    }
}
//# sourceMappingURL=AggregateRoot.js.map