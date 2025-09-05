import { BaseDomainEvent } from '../../events/DomainEvent';
export class ProblemSetItemsReorderedEvent extends BaseDomainEvent {
    problemSetId;
    newOrder;
    eventType = 'ProblemSetItemsReordered';
    constructor(problemSetId, newOrder) {
        super(problemSetId);
        this.problemSetId = problemSetId;
        this.newOrder = newOrder;
    }
    getEventData() {
        return {
            problemSetId: this.problemSetId,
            newOrder: [...this.newOrder],
            occurredAt: this.occurredOn
        };
    }
}
//# sourceMappingURL=ProblemSetItemsReorderedEvent.js.map