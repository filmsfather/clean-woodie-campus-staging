import { BaseDomainEvent } from '../../events/DomainEvent';
import { UniqueEntityID } from '../../common/Identifier';

export interface ProblemAnswerUpdatedEventData {
  problemId: UniqueEntityID;
  teacherId: string;
  previousAnswerType: string;
  newAnswerType: string;
  occurredAt: Date;
}

export class ProblemAnswerUpdatedEvent extends BaseDomainEvent {
  public readonly eventType = 'ProblemAnswerUpdated';

  constructor(
    public readonly problemId: UniqueEntityID,
    public readonly teacherId: string,
    public readonly previousAnswerType: string,
    public readonly newAnswerType: string
  ) {
    super(problemId);
  }

  public getEventData(): ProblemAnswerUpdatedEventData {
    return {
      problemId: this.problemId,
      teacherId: this.teacherId,
      previousAnswerType: this.previousAnswerType,
      newAnswerType: this.newAnswerType,
      occurredAt: this.occurredOn
    };
  }
}