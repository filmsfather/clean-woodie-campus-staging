import { BaseDomainEvent } from '../../events/DomainEvent';
import { UniqueEntityID } from '../../common/Identifier';
export interface ProblemCreatedEventData {
    problemId: UniqueEntityID;
    teacherId: string;
    problemTitle: string;
    problemType: string;
    difficulty: number;
    tags: string[];
    occurredAt: Date;
}
export declare class ProblemCreatedEvent extends BaseDomainEvent {
    readonly problemId: UniqueEntityID;
    readonly teacherId: string;
    readonly problemTitle: string;
    readonly problemType: string;
    readonly difficulty: number;
    readonly tags: string[];
    readonly eventType = "ProblemCreated";
    constructor(problemId: UniqueEntityID, teacherId: string, problemTitle: string, problemType: string, difficulty: number, tags: string[]);
    getEventData(): ProblemCreatedEventData;
}
//# sourceMappingURL=ProblemCreatedEvent.d.ts.map