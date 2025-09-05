import { BaseDomainEvent } from '../../events/DomainEvent';
import { UniqueEntityID } from '../../common/Identifier';

export interface ProblemSetCreatedEventData {
  problemSetId: UniqueEntityID;
  teacherId: UniqueEntityID;
  title: string;
  occurredAt: Date;
}

export class ProblemSetCreatedEvent extends BaseDomainEvent {
  public readonly eventType = 'ProblemSetCreated';

  constructor(
    public readonly problemSetId: UniqueEntityID,
    public readonly teacherId: UniqueEntityID,
    public readonly title: string
  ) {
    super(problemSetId);
  }

  public getEventData(): ProblemSetCreatedEventData {
    return {
      problemSetId: this.problemSetId,
      teacherId: this.teacherId,
      title: this.title,
      occurredAt: this.occurredOn
    };
  }
}