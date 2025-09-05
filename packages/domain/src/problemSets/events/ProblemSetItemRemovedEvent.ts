import { BaseDomainEvent } from '../../events/DomainEvent';
import { UniqueEntityID } from '../../common/Identifier';

export interface ProblemSetItemRemovedEventData {
  problemSetId: UniqueEntityID;
  problemId: UniqueEntityID;
  removedFromIndex: number;
  occurredAt: Date;
}

export class ProblemSetItemRemovedEvent extends BaseDomainEvent {
  public readonly eventType = 'ProblemSetItemRemoved';

  constructor(
    public readonly problemSetId: UniqueEntityID,
    public readonly problemId: UniqueEntityID,
    public readonly removedFromIndex: number
  ) {
    super(problemSetId);
  }

  public getEventData(): ProblemSetItemRemovedEventData {
    return {
      problemSetId: this.problemSetId,
      problemId: this.problemId,
      removedFromIndex: this.removedFromIndex,
      occurredAt: this.occurredOn
    };
  }
}