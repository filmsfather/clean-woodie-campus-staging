import { BaseDomainEvent } from '../../events/DomainEvent';
// 과제 배정 취소 이벤트
export class AssignmentTargetRevokedEvent extends BaseDomainEvent {
    eventType = 'AssignmentTargetRevoked';
    assignmentId;
    targetType;
    targetId;
    revokedBy;
    revokedAt;
    constructor(assignmentId, targetType, targetId, revokedBy, revokedAt = new Date()) {
        super(assignmentId);
        this.assignmentId = assignmentId;
        this.targetType = targetType;
        this.targetId = targetId;
        this.revokedBy = revokedBy;
        this.revokedAt = revokedAt;
    }
    getAggregateId() {
        return this.assignmentId;
    }
}
//# sourceMappingURL=AssignmentTargetRevokedEvent.js.map