import { BaseDomainEvent } from '../../events/DomainEvent';
import { UniqueEntityID } from '../../common/Identifier';
export declare class AssignmentDueDateChangedEvent extends BaseDomainEvent {
    readonly eventType = "AssignmentDueDateChanged";
    readonly assignmentId: UniqueEntityID;
    readonly previousDueDate: Date;
    readonly newDueDate: Date;
    readonly changedBy: string;
    readonly changedAt: Date;
    readonly reason?: string;
    constructor(assignmentId: UniqueEntityID, previousDueDate: Date, newDueDate: Date, changedBy: string, reason?: string, changedAt?: Date);
    getAggregateId(): UniqueEntityID;
}
//# sourceMappingURL=AssignmentDueDateChangedEvent.d.ts.map