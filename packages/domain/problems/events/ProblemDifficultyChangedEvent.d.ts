import { BaseDomainEvent } from '../../events/DomainEvent';
import { UniqueEntityID } from '../../common/Identifier';
export interface ProblemDifficultyChangedEventData {
    problemId: UniqueEntityID;
    teacherId: string;
    previousDifficulty: number;
    newDifficulty: number;
    occurredAt: Date;
}
export declare class ProblemDifficultyChangedEvent extends BaseDomainEvent {
    readonly problemId: UniqueEntityID;
    readonly teacherId: string;
    readonly previousDifficulty: number;
    readonly newDifficulty: number;
    readonly eventType = "ProblemDifficultyChanged";
    constructor(problemId: UniqueEntityID, teacherId: string, previousDifficulty: number, newDifficulty: number);
    getEventData(): ProblemDifficultyChangedEventData;
}
//# sourceMappingURL=ProblemDifficultyChangedEvent.d.ts.map