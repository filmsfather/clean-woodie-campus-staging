import { BaseDomainEvent } from '../../events/DomainEvent';
import { UniqueEntityID } from '../../common/Identifier';
export interface ProblemContentUpdatedEventData {
    problemId: UniqueEntityID;
    teacherId: string;
    previousContent: {
        title: string;
        description: string;
    };
    newContent: {
        title: string;
        description: string;
    };
    occurredAt: Date;
}
export declare class ProblemContentUpdatedEvent extends BaseDomainEvent {
    readonly problemId: UniqueEntityID;
    readonly teacherId: string;
    readonly previousContent: {
        title: string;
        description: string;
    };
    readonly newContent: {
        title: string;
        description: string;
    };
    readonly eventType = "ProblemContentUpdated";
    constructor(problemId: UniqueEntityID, teacherId: string, previousContent: {
        title: string;
        description: string;
    }, newContent: {
        title: string;
        description: string;
    });
    getEventData(): ProblemContentUpdatedEventData;
}
//# sourceMappingURL=ProblemContentUpdatedEvent.d.ts.map