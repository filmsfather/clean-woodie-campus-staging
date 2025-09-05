import { BaseDomainEvent } from '../../events/DomainEvent';
export class ProblemDeactivatedEvent extends BaseDomainEvent {
    problemId;
    teacherId;
    problemTitle;
    eventType = 'ProblemDeactivated';
    constructor(problemId, teacherId, problemTitle) {
        super(problemId);
        this.problemId = problemId;
        this.teacherId = teacherId;
        this.problemTitle = problemTitle;
    }
    getEventData() {
        return {
            problemId: this.problemId,
            teacherId: this.teacherId,
            problemTitle: this.problemTitle,
            occurredAt: this.occurredOn
        };
    }
}
//# sourceMappingURL=ProblemDeactivatedEvent.js.map