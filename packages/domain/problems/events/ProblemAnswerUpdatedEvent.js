import { BaseDomainEvent } from '../../events/DomainEvent';
export class ProblemAnswerUpdatedEvent extends BaseDomainEvent {
    problemId;
    teacherId;
    previousAnswerType;
    newAnswerType;
    eventType = 'ProblemAnswerUpdated';
    constructor(problemId, teacherId, previousAnswerType, newAnswerType) {
        super(problemId);
        this.problemId = problemId;
        this.teacherId = teacherId;
        this.previousAnswerType = previousAnswerType;
        this.newAnswerType = newAnswerType;
    }
    getEventData() {
        return {
            problemId: this.problemId,
            teacherId: this.teacherId,
            previousAnswerType: this.previousAnswerType,
            newAnswerType: this.newAnswerType,
            occurredAt: this.occurredOn
        };
    }
}
//# sourceMappingURL=ProblemAnswerUpdatedEvent.js.map