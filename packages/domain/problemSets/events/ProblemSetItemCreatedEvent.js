import { BaseDomainEvent } from '../../events/DomainEvent';
export class ProblemSetItemCreatedEvent extends BaseDomainEvent {
    problemSetId;
    problemId;
    orderIndex;
    eventType = 'ProblemSetItemCreated';
    constructor(problemSetId, problemId, orderIndex) {
        super(problemSetId);
        this.problemSetId = problemSetId;
        this.problemId = problemId;
        this.orderIndex = orderIndex;
    }
    getEventData() {
        return {
            problemSetId: this.problemSetId,
            problemId: this.problemId,
            orderIndex: this.orderIndex,
            occurredAt: this.occurredOn
        };
    }
}
//# sourceMappingURL=ProblemSetItemCreatedEvent.js.map