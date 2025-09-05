import { BaseDomainEvent } from '../../events/DomainEvent';
export class ProblemSetCreatedEvent extends BaseDomainEvent {
    problemSetId;
    teacherId;
    title;
    eventType = 'ProblemSetCreated';
    constructor(problemSetId, teacherId, title) {
        super(problemSetId);
        this.problemSetId = problemSetId;
        this.teacherId = teacherId;
        this.title = title;
    }
    getEventData() {
        return {
            problemSetId: this.problemSetId,
            teacherId: this.teacherId,
            title: this.title,
            occurredAt: this.occurredOn
        };
    }
}
//# sourceMappingURL=ProblemSetCreatedEvent.js.map