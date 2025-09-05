import { BaseDomainEvent } from '../../events/DomainEvent';
export class ProblemActivatedEvent extends BaseDomainEvent {
    problemId;
    teacherId;
    problemTitle;
    eventType = 'ProblemActivated';
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
//# sourceMappingURL=ProblemActivatedEvent.js.map