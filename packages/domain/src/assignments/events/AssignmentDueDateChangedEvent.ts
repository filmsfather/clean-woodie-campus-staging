import { BaseDomainEvent } from '../../events/DomainEvent';
import { UniqueEntityID } from '../../common/Identifier';

// 과제 마감일 변경 이벤트
export class AssignmentDueDateChangedEvent extends BaseDomainEvent {
  public readonly eventType = 'AssignmentDueDateChanged'
  public readonly assignmentId: UniqueEntityID;
  public readonly previousDueDate: Date;
  public readonly newDueDate: Date;
  public readonly changedBy: string;
  public readonly changedAt: Date;
  public readonly reason?: string;

  constructor(
    assignmentId: UniqueEntityID,
    previousDueDate: Date,
    newDueDate: Date,
    changedBy: string,
    reason?: string,
    changedAt: Date = new Date()
  ) {
    super();
    this.assignmentId = assignmentId;
    this.previousDueDate = previousDueDate;
    this.newDueDate = newDueDate;
    this.changedBy = changedBy;
    this.reason = reason;
    this.changedAt = changedAt;
  }

  public getAggregateId(): UniqueEntityID {
    return this.assignmentId;
  }
}