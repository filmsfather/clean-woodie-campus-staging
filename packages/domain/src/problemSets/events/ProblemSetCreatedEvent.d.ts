import { BaseDomainEvent } from '../../events/DomainEvent';
import { UniqueEntityID } from '../../common/Identifier';
export interface ProblemSetCreatedEventData {
    problemSetId: UniqueEntityID;
    teacherId: UniqueEntityID;
    title: string;
    occurredAt: Date;
}
export declare class ProblemSetCreatedEvent extends BaseDomainEvent {
    readonly problemSetId: UniqueEntityID;
    readonly teacherId: UniqueEntityID;
    readonly title: string;
    readonly eventType = "ProblemSetCreated";
    constructor(problemSetId: UniqueEntityID, teacherId: UniqueEntityID, title: string);
    getEventData(): ProblemSetCreatedEventData;
}
//# sourceMappingURL=ProblemSetCreatedEvent.d.ts.map