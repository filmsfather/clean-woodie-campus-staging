import { BaseDomainEvent } from '../../events/DomainEvent';
import { UniqueEntityID } from '../../common/Identifier';
export declare class AssignmentDueDateExtendedEvent extends BaseDomainEvent {
    readonly eventType = "AssignmentDueDateExtended";
    readonly assignmentId: UniqueEntityID;
    readonly previousDueDate: Date;
    readonly newDueDate: Date;
    readonly extendedHours: number;
    readonly extendedBy: string;
    readonly extendedAt: Date;
    constructor(assignmentId: UniqueEntityID, previousDueDate: Date, newDueDate: Date, extendedHours: number, extendedBy: string, extendedAt?: Date);
    getAggregateId(): UniqueEntityID;
}
//# sourceMappingURL=AssignmentDueDateExtendedEvent.d.ts.map