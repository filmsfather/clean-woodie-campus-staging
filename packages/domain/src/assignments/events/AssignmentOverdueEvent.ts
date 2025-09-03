import { BaseDomainEvent } from '../../events/DomainEvent';
import { UniqueEntityID } from '../../common/Identifier';

// 과제 마감 이벤트
export class AssignmentOverdueEvent extends BaseDomainEvent {
  public readonly eventType = 'AssignmentOverdue'
  public readonly assignmentId: UniqueEntityID;
  public readonly title: string;
  public readonly dueDate: Date;
  public readonly teacherId: string;
  public readonly activeTargetCount: number;
  public readonly overdueAt: Date;

  constructor(
    assignmentId: UniqueEntityID,
    title: string,
    dueDate: Date,
    teacherId: string,
    activeTargetCount: number,
    overdueAt: Date = new Date()
  ) {
    super();
    this.assignmentId = assignmentId;
    this.title = title;
    this.dueDate = dueDate;
    this.teacherId = teacherId;
    this.activeTargetCount = activeTargetCount;
    this.overdueAt = overdueAt;
  }

  public getAggregateId(): UniqueEntityID {
    return this.assignmentId;
  }
}