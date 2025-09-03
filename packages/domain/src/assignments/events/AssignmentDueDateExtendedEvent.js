import { BaseDomainEvent } from '../../events/DomainEvent';
// 과제 마감일 연장 이벤트
export class AssignmentDueDateExtendedEvent extends BaseDomainEvent {
    eventType = 'AssignmentDueDateExtended';
    assignmentId;
    previousDueDate;
    newDueDate;
    extendedHours;
    extendedBy;
    extendedAt;
    constructor(assignmentId, previousDueDate, newDueDate, extendedHours, extendedBy, extendedAt = new Date()) {
        super();
        this.assignmentId = assignmentId;
        this.previousDueDate = previousDueDate;
        this.newDueDate = newDueDate;
        this.extendedHours = extendedHours;
        this.extendedBy = extendedBy;
        this.extendedAt = extendedAt;
    }
    getAggregateId() {
        return this.assignmentId;
    }
}
//# sourceMappingURL=AssignmentDueDateExtendedEvent.js.map