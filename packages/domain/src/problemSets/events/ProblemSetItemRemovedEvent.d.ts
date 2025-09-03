import { BaseDomainEvent } from '../../events/DomainEvent';
import { UniqueEntityID } from '../../common/Identifier';
export interface ProblemSetItemRemovedEventData {
    problemSetId: UniqueEntityID;
    problemId: UniqueEntityID;
    removedFromIndex: number;
    occurredAt: Date;
}
export declare class ProblemSetItemRemovedEvent extends BaseDomainEvent {
    readonly problemSetId: UniqueEntityID;
    readonly problemId: UniqueEntityID;
    readonly removedFromIndex: number;
    readonly eventType = "ProblemSetItemRemoved";
    constructor(problemSetId: UniqueEntityID, problemId: UniqueEntityID, removedFromIndex: number);
    getEventData(): ProblemSetItemRemovedEventData;
}
//# sourceMappingURL=ProblemSetItemRemovedEvent.d.ts.map