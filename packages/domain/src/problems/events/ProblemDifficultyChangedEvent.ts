import { BaseDomainEvent } from '../../events/DomainEvent';
import { UniqueEntityID } from '../../common/Identifier';

export interface ProblemDifficultyChangedEventData {
  problemId: UniqueEntityID;
  teacherId: string;
  previousDifficulty: number;
  newDifficulty: number;
  occurredAt: Date;
}

export class ProblemDifficultyChangedEvent extends BaseDomainEvent {
  public readonly eventType = 'ProblemDifficultyChanged';

  constructor(
    public readonly problemId: UniqueEntityID,
    public readonly teacherId: string,
    public readonly previousDifficulty: number,
    public readonly newDifficulty: number
  ) {
    super(problemId);
  }

  public getEventData(): ProblemDifficultyChangedEventData {
    return {
      problemId: this.problemId,
      teacherId: this.teacherId,
      previousDifficulty: this.previousDifficulty,
      newDifficulty: this.newDifficulty,
      occurredAt: this.occurredOn
    };
  }
}