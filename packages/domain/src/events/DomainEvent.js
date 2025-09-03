export class BaseDomainEvent {
    occurredOn;
    eventId;
    constructor() {
        this.occurredOn = new Date();
        this.eventId = this.generateUniqueId();
    }
    generateUniqueId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}
//# sourceMappingURL=DomainEvent.js.map