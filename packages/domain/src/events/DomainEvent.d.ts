export interface DomainEvent {
    readonly occurredOn: Date;
    readonly eventId: string;
    readonly eventType: string;
}
export declare abstract class BaseDomainEvent implements DomainEvent {
    readonly occurredOn: Date;
    readonly eventId: string;
    abstract readonly eventType: string;
    constructor();
    private generateUniqueId;
}
//# sourceMappingURL=DomainEvent.d.ts.map