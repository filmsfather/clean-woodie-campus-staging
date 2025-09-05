import { BaseDomainEvent } from '../../events/DomainEvent';
export class ProblemDifficultyChangedEvent extends BaseDomainEvent {
    problemId;
    teacherId;
    previousDifficulty;
    newDifficulty;
    eventType = 'ProblemDifficultyChanged';
    constructor(problemId, teacherId, previousDifficulty, newDifficulty) {
        super(problemId);
        this.problemId = problemId;
        this.teacherId = teacherId;
        this.previousDifficulty = previousDifficulty;
        this.newDifficulty = newDifficulty;
    }
    getEventData() {
        return {
            problemId: this.problemId,
            teacherId: this.teacherId,
            previousDifficulty: this.previousDifficulty,
            newDifficulty: this.newDifficulty,
            occurredAt: this.occurredOn
        };
    }
}
//# sourceMappingURL=ProblemDifficultyChangedEvent.js.map