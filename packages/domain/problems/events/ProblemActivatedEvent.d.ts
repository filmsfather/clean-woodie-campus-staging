import { BaseDomainEvent } from '../../events/DomainEvent';
import { UniqueEntityID } from '../../common/Identifier';
export interface ProblemActivatedEventData {
    problemId: UniqueEntityID;
    teacherId: string;
    problemTitle: string;
    occurredAt: Date;
}
export declare class ProblemActivatedEvent extends BaseDomainEvent {
    readonly problemId: UniqueEntityID;
    readonly teacherId: string;
    readonly problemTitle: string;
    readonly eventType = "ProblemActivated";
    constructor(problemId: UniqueEntityID, teacherId: string, problemTitle: string);
    getEventData(): ProblemActivatedEventData;
}
//# sourceMappingURL=ProblemActivatedEvent.d.ts.map