import { BaseDomainEvent } from '../../events/DomainEvent';
// 과제 배정 대상 추가 이벤트
export class AssignmentTargetAddedEvent extends BaseDomainEvent {
    eventType = 'AssignmentTargetAdded';
    assignmentId;
    targetType;
    targetId;
    assignedBy;
    assignedAt;
    constructor(assignmentId, targetType, targetId, assignedBy, assignedAt = new Date()) {
        super();
        this.assignmentId = assignmentId;
        this.targetType = targetType;
        this.targetId = targetId;
        this.assignedBy = assignedBy;
        this.assignedAt = assignedAt;
    }
    getAggregateId() {
        return this.assignmentId;
    }
}
//# sourceMappingURL=AssignmentTargetAddedEvent.js.map