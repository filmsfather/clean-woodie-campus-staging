import { BaseDomainEvent } from '../../events/DomainEvent';
import { UniqueEntityID } from '../../common/Identifier';
export interface ProblemSetItemsReorderedEventData {
    problemSetId: UniqueEntityID;
    newOrder: UniqueEntityID[];
    occurredAt: Date;
}
export declare class ProblemSetItemsReorderedEvent extends BaseDomainEvent {
    readonly problemSetId: UniqueEntityID;
    readonly newOrder: UniqueEntityID[];
    readonly eventType = "ProblemSetItemsReordered";
    constructor(problemSetId: UniqueEntityID, newOrder: UniqueEntityID[]);
    getEventData(): ProblemSetItemsReorderedEventData;
}
//# sourceMappingURL=ProblemSetItemsReorderedEvent.d.ts.map