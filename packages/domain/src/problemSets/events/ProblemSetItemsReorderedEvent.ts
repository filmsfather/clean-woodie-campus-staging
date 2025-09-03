import { BaseDomainEvent } from '../../events/DomainEvent';
import { UniqueEntityID } from '../../common/Identifier';

export interface ProblemSetItemsReorderedEventData {
  problemSetId: UniqueEntityID;
  newOrder: UniqueEntityID[];
  occurredAt: Date;
}

export class ProblemSetItemsReorderedEvent extends BaseDomainEvent {
  public readonly eventType = 'ProblemSetItemsReordered';

  constructor(
    public readonly problemSetId: UniqueEntityID,
    public readonly newOrder: UniqueEntityID[]
  ) {
    super();
  }

  public getEventData(): ProblemSetItemsReorderedEventData {
    return {
      problemSetId: this.problemSetId,
      newOrder: [...this.newOrder],
      occurredAt: this.occurredOn
    };
  }
}