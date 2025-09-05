import { BaseDomainEvent } from '../../events/DomainEvent';
import { UniqueEntityID } from '../../common/Identifier';

export interface ProblemContentUpdatedEventData {
  problemId: UniqueEntityID;
  teacherId: string;
  previousContent: {
    title: string;
    description: string;
  };
  newContent: {
    title: string;
    description: string;
  };
  occurredAt: Date;
}

export class ProblemContentUpdatedEvent extends BaseDomainEvent {
  public readonly eventType = 'ProblemContentUpdated';

  constructor(
    public readonly problemId: UniqueEntityID,
    public readonly teacherId: string,
    public readonly previousContent: { title: string; description: string },
    public readonly newContent: { title: string; description: string }
  ) {
    super(problemId);
  }

  public getEventData(): ProblemContentUpdatedEventData {
    return {
      problemId: this.problemId,
      teacherId: this.teacherId,
      previousContent: this.previousContent,
      newContent: this.newContent,
      occurredAt: this.occurredOn
    };
  }
}