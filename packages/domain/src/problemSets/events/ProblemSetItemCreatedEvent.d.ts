import { BaseDomainEvent } from '../../events/DomainEvent';
import { UniqueEntityID } from '../../common/Identifier';
export interface ProblemSetItemCreatedEventData {
    problemSetId: UniqueEntityID;
    problemId: UniqueEntityID;
    orderIndex: number;
    occurredAt: Date;
}
export declare class ProblemSetItemCreatedEvent extends BaseDomainEvent {
    readonly problemSetId: UniqueEntityID;
    readonly problemId: UniqueEntityID;
    readonly orderIndex: number;
    readonly eventType = "ProblemSetItemCreated";
    constructor(problemSetId: UniqueEntityID, problemId: UniqueEntityID, orderIndex: number);
    getEventData(): ProblemSetItemCreatedEventData;
}
//# sourceMappingURL=ProblemSetItemCreatedEvent.d.ts.map