import { BaseDomainEvent } from '../../events/DomainEvent';
import { UniqueEntityID } from '../../common/Identifier';
export interface ProblemDeactivatedEventData {
    problemId: UniqueEntityID;
    teacherId: string;
    problemTitle: string;
    occurredAt: Date;
}
export declare class ProblemDeactivatedEvent extends BaseDomainEvent {
    readonly problemId: UniqueEntityID;
    readonly teacherId: string;
    readonly problemTitle: string;
    readonly eventType = "ProblemDeactivated";
    constructor(problemId: UniqueEntityID, teacherId: string, problemTitle: string);
    getEventData(): ProblemDeactivatedEventData;
}
//# sourceMappingURL=ProblemDeactivatedEvent.d.ts.map