import { BaseDomainEvent } from '../../events/DomainEvent';
// 과제 마감 이벤트
export class AssignmentOverdueEvent extends BaseDomainEvent {
    eventType = 'AssignmentOverdue';
    assignmentId;
    title;
    dueDate;
    teacherId;
    activeTargetCount;
    overdueAt;
    constructor(assignmentId, title, dueDate, teacherId, activeTargetCount, overdueAt = new Date()) {
        super(assignmentId);
        this.assignmentId = assignmentId;
        this.title = title;
        this.dueDate = dueDate;
        this.teacherId = teacherId;
        this.activeTargetCount = activeTargetCount;
        this.overdueAt = overdueAt;
    }
    getAggregateId() {
        return this.assignmentId;
    }
}
//# sourceMappingURL=AssignmentOverdueEvent.js.map