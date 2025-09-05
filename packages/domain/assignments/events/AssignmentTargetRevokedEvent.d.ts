import { BaseDomainEvent } from '../../events/DomainEvent';
import { UniqueEntityID } from '../../common/Identifier';
import { AssignmentTargetType } from '../value-objects/AssignmentTargetIdentifier';
export declare class AssignmentTargetRevokedEvent extends BaseDomainEvent {
    readonly eventType = "AssignmentTargetRevoked";
    readonly assignmentId: UniqueEntityID;
    readonly targetType: AssignmentTargetType;
    readonly targetId: string;
    readonly revokedBy: string;
    readonly revokedAt: Date;
    constructor(assignmentId: UniqueEntityID, targetType: AssignmentTargetType, targetId: string, revokedBy: string, revokedAt?: Date);
    getAggregateId(): UniqueEntityID;
}
//# sourceMappingURL=AssignmentTargetRevokedEvent.d.ts.map