import { BaseDomainEvent } from '../../events/DomainEvent';
export class ProblemContentUpdatedEvent extends BaseDomainEvent {
    problemId;
    teacherId;
    previousContent;
    newContent;
    eventType = 'ProblemContentUpdated';
    constructor(problemId, teacherId, previousContent, newContent) {
        super(problemId);
        this.problemId = problemId;
        this.teacherId = teacherId;
        this.previousContent = previousContent;
        this.newContent = newContent;
    }
    getEventData() {
        return {
            problemId: this.problemId,
            teacherId: this.teacherId,
            previousContent: this.previousContent,
            newContent: this.newContent,
            occurredAt: this.occurredOn
        };
    }
}
//# sourceMappingURL=ProblemContentUpdatedEvent.js.map