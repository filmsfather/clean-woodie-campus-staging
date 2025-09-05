import { UniqueEntityID } from '../common/Identifier';
export class BaseDomainEvent {
    occurredOn;
    eventId;
    aggregateId;
    eventVersion;
    metadata;
    correlationId;
    causationId;
    constructor(aggregateId, eventVersion = 1, metadata, correlationId, causationId) {
        this.occurredOn = new Date();
        this.eventId = new UniqueEntityID();
        this.aggregateId = aggregateId;
        this.eventVersion = eventVersion;
        this.metadata = metadata;
        this.correlationId = correlationId;
        this.causationId = causationId;
    }
}
//# sourceMappingURL=DomainEvent.js.map