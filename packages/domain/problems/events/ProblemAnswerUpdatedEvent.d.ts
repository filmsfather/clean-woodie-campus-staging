import { BaseDomainEvent } from '../../events/DomainEvent';
import { UniqueEntityID } from '../../common/Identifier';
export interface ProblemAnswerUpdatedEventData {
    problemId: UniqueEntityID;
    teacherId: string;
    previousAnswerType: string;
    newAnswerType: string;
    occurredAt: Date;
}
export declare class ProblemAnswerUpdatedEvent extends BaseDomainEvent {
    readonly problemId: UniqueEntityID;
    readonly teacherId: string;
    readonly previousAnswerType: string;
    readonly newAnswerType: string;
    readonly eventType = "ProblemAnswerUpdated";
    constructor(problemId: UniqueEntityID, teacherId: string, previousAnswerType: string, newAnswerType: string);
    getEventData(): ProblemAnswerUpdatedEventData;
}
//# sourceMappingURL=ProblemAnswerUpdatedEvent.d.ts.map