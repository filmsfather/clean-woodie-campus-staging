import { BaseDomainEvent } from '../../events/DomainEvent';
export class ProblemSetItemRemovedEvent extends BaseDomainEvent {
    problemSetId;
    problemId;
    removedFromIndex;
    eventType = 'ProblemSetItemRemoved';
    constructor(problemSetId, problemId, removedFromIndex) {
        super(problemSetId);
        this.problemSetId = problemSetId;
        this.problemId = problemId;
        this.removedFromIndex = removedFromIndex;
    }
    getEventData() {
        return {
            problemSetId: this.problemSetId,
            problemId: this.problemId,
            removedFromIndex: this.removedFromIndex,
            occurredAt: this.occurredOn
        };
    }
}
//# sourceMappingURL=ProblemSetItemRemovedEvent.js.map