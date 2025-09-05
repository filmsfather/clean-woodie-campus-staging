import { UniqueEntityID } from '../common/Identifier';
export interface DomainEvent {
    readonly occurredOn: Date;
    readonly eventId: UniqueEntityID;
    readonly eventType: string;
    readonly aggregateId: UniqueEntityID;
    readonly eventVersion: number;
    readonly metadata?: Record<string, any>;
    readonly correlationId?: string;
    readonly causationId?: string;
}
export declare abstract class BaseDomainEvent implements DomainEvent {
    readonly occurredOn: Date;
    readonly eventId: UniqueEntityID;
    abstract readonly eventType: string;
    readonly aggregateId: UniqueEntityID;
    readonly eventVersion: number;
    readonly metadata?: Record<string, any>;
    readonly correlationId?: string;
    readonly causationId?: string;
    constructor(aggregateId: UniqueEntityID, eventVersion?: number, metadata?: Record<string, any>, correlationId?: string, causationId?: string);
}
//# sourceMappingURL=DomainEvent.d.ts.map