import { BaseDomainEvent } from '../../events/DomainEvent';
import { UniqueEntityID } from '../../common/Identifier';

export interface ProblemCreatedEventData {
  problemId: UniqueEntityID;
  teacherId: string;
  problemTitle: string;
  problemType: string;
  difficulty: number;
  tags: string[];
  occurredAt: Date;
}

export class ProblemCreatedEvent extends BaseDomainEvent {
  public readonly eventType = 'ProblemCreated';

  constructor(
    public readonly problemId: UniqueEntityID,
    public readonly teacherId: string,
    public readonly problemTitle: string,
    public readonly problemType: string,
    public readonly difficulty: number,
    public readonly tags: string[]
  ) {
    super(problemId);
  }

  public getEventData(): ProblemCreatedEventData {
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