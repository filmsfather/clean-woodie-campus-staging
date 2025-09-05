import { BaseDomainEvent } from '../../events/DomainEvent';
import { UniqueEntityID } from '../../common/Identifier';

export interface ProblemActivatedEventData {
  problemId: UniqueEntityID;
  teacherId: string;
  problemTitle: string;
  occurredAt: Date;
}

export class ProblemActivatedEvent extends BaseDomainEvent {
  public readonly eventType = 'ProblemActivated';

  constructor(
    public readonly problemId: UniqueEntityID,
    public readonly teacherId: string,
    public readonly problemTitle: string
  ) {
    super(problemId);
  }

  public getEventData(): ProblemActivatedEventData {
    return {
      problemId: this.problemId,
      teacherId: this.teacherId,
      problemTitle: this.problemTitle,
      occurredAt: this.occurredOn
    };
  }
}