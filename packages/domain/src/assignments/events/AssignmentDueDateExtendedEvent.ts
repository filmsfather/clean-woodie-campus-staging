import { BaseDomainEvent } from '../../events/DomainEvent';
import { UniqueEntityID } from '../../common/Identifier';

// 과제 마감일 연장 이벤트
export class AssignmentDueDateExtendedEvent extends BaseDomainEvent {
  public readonly eventType = 'AssignmentDueDateExtended'
  public readonly assignmentId: UniqueEntityID;
  public readonly previousDueDate: Date;
  public readonly newDueDate: Date;
  public readonly extendedHours: number;
  public readonly extendedBy: string;
  public readonly extendedAt: Date;

  constructor(
    assignmentId: UniqueEntityID,
    previousDueDate: Date,
    newDueDate: Date,
    extendedHours: number,
    extendedBy: string,
    extendedAt: Date = new Date()
  ) {
    super(assignmentId);
    this.assignmentId = assignmentId;
    this.previousDueDate = previousDueDate;
    this.newDueDate = newDueDate;
    this.extendedHours = extendedHours;
    this.extendedBy = extendedBy;
    this.extendedAt = extendedAt;
  }

  public getAggregateId(): UniqueEntityID {
    return this.assignmentId;
  }
}