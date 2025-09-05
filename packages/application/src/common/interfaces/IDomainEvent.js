import { UniqueEntityID } from '@woodie/domain/common/Identifier';
export class DomainEvent {
    eventId;
    aggregateId;
    eventType;
    eventVersion;
    occurredOn;
    correlationId;
    causationId;
    metadata;
    constructor(aggregateId, eventType, eventVersion = 1, correlationId, causationId, metadata) {
        this.eventId = new UniqueEntityID();
        this.aggregateId = aggregateId;
        this.eventType = eventType;
        this.eventVersion = eventVersion;
        this.occurredOn = new Date();
        this.correlationId = correlationId;
        this.causationId = causationId;
        this.metadata = metadata;
    }
    toJSON() {
        return {
            eventId: this.eventId.toString(),
            aggregateId: this.aggregateId.toString(),
            eventType: this.eventType,
            eventVersion: this.eventVersion,
            occurredOn: this.occurredOn.toISOString(),
            correlationId: this.correlationId,
            causationId: this.causationId,
            metadata: this.metadata,
            payload: this.getPayload()
        };
    }
}
//# sourceMappingURL=IDomainEvent.js.map