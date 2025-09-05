import { BaseDomainEvent } from '../../events/DomainEvent';
export class ProblemCreatedEvent extends BaseDomainEvent {
    problemId;
    teacherId;
    problemTitle;
    problemType;
    difficulty;
    tags;
    eventType = 'ProblemCreated';
    constructor(problemId, teacherId, problemTitle, problemType, difficulty, tags) {
        super(problemId);
        this.problemId = problemId;
        this.teacherId = teacherId;
        this.problemTitle = problemTitle;
        this.problemType = problemType;
        this.difficulty = difficulty;
        this.tags = tags;
    }
    getEventData() {
        return {
            problemId: this.problemId,
            teacherId: this.teacherId,
            problemTitle: this.problemTitle,
            problemType: this.problemType,
            difficulty: this.difficulty,
            tags: this.tags,
            occurredAt: this.occurredOn
        };
    }
}
//# sourceMappingURL=ProblemCreatedEvent.js.map