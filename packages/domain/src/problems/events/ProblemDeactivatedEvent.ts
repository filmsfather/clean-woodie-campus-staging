import { BaseDomainEvent } from '../../events/DomainEvent';
import { UniqueEntityID } from '../../common/Identifier';

export interface ProblemDeactivatedEventData {
  problemId: UniqueEntityID;
  teacherId: string;
  problemTitle: string;
  occurredAt: Date;
}

export class ProblemDeactivatedEvent extends BaseDomainEvent {
  public readonly eventType = 'ProblemDeactivated';

  constructor(
    public readonly problemId: UniqueEntityID,
    public readonly teacherId: string,
    public readonly problemTitle: string
  ) {
    super(problemId);
  }

  public getEventData(): ProblemDeactivatedEventData {
    return {
      problemId: this.problemId,
      teacherId: this.teacherId,
      problemTitle: this.problemTitle,
      occurredAt: this.occurredOn
    };
  }
}