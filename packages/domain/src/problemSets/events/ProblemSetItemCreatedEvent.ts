import { BaseDomainEvent } from '../../events/DomainEvent';
import { UniqueEntityID } from '../../common/Identifier';

export interface ProblemSetItemCreatedEventData {
  problemSetId: UniqueEntityID;
  problemId: UniqueEntityID;
  orderIndex: number;
  occurredAt: Date;
}

export class ProblemSetItemCreatedEvent extends BaseDomainEvent {
  public readonly eventType = 'ProblemSetItemCreated';

  constructor(
    public readonly problemSetId: UniqueEntityID,
    public readonly problemId: UniqueEntityID,
    public readonly orderIndex: number
  ) {
    super();
  }

  public getEventData(): ProblemSetItemCreatedEventData {
    return {
      problemSetId: this.problemSetId,
      problemId: this.problemId,
      orderIndex: this.orderIndex,
      occurredAt: this.occurredOn
    };
  }
}