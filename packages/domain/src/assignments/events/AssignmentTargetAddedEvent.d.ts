import { BaseDomainEvent } from '../../events/DomainEvent';
import { UniqueEntityID } from '../../common/Identifier';
import { AssignmentTargetType } from '../value-objects/AssignmentTargetIdentifier';
export declare class AssignmentTargetAddedEvent extends BaseDomainEvent {
    readonly eventType = "AssignmentTargetAdded";
    readonly assignmentId: UniqueEntityID;
    readonly targetType: AssignmentTargetType;
    readonly targetId: string;
    readonly assignedBy: string;
    readonly assignedAt: Date;
    constructor(assignmentId: UniqueEntityID, targetType: AssignmentTargetType, targetId: string, assignedBy: string, assignedAt?: Date);
    getAggregateId(): UniqueEntityID;
}
//# sourceMappingURL=AssignmentTargetAddedEvent.d.ts.map