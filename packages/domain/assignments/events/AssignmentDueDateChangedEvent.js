import { BaseDomainEvent } from '../../events/DomainEvent';
// 과제 마감일 변경 이벤트
export class AssignmentDueDateChangedEvent extends BaseDomainEvent {
    eventType = 'AssignmentDueDateChanged';
    assignmentId;
    previousDueDate;
    newDueDate;
    changedBy;
    changedAt;
    reason;
    constructor(assignmentId, previousDueDate, newDueDate, changedBy, reason, changedAt = new Date()) {
        super(assignmentId);
        this.assignmentId = assignmentId;
        this.previousDueDate = previousDueDate;
        this.newDueDate = newDueDate;
        this.changedBy = changedBy;
        this.reason = reason;
        this.changedAt = changedAt;
    }
    getAggregateId() {
        return this.assignmentId;
    }
}
//# sourceMappingURL=AssignmentDueDateChangedEvent.js.map