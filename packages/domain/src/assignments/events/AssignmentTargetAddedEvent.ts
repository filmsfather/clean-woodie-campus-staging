import { BaseDomainEvent } from '../../events/DomainEvent';
import { UniqueEntityID } from '../../common/Identifier';
import { AssignmentTargetType } from '../value-objects/AssignmentTargetIdentifier';

// 과제 배정 대상 추가 이벤트
export class AssignmentTargetAddedEvent extends BaseDomainEvent {
  public readonly eventType = 'AssignmentTargetAdded'
  public readonly assignmentId: UniqueEntityID;
  public readonly targetType: AssignmentTargetType;
  public readonly targetId: string;
  public readonly assignedBy: string;
  public readonly assignedAt: Date;

  constructor(
    assignmentId: UniqueEntityID,
    targetType: AssignmentTargetType,
    targetId: string,
    assignedBy: string,
    assignedAt: Date = new Date()
  ) {
    super();
    this.assignmentId = assignmentId;
    this.targetType = targetType;
    this.targetId = targetId;
    this.assignedBy = assignedBy;
    this.assignedAt = assignedAt;
  }

  public getAggregateId(): UniqueEntityID {
    return this.assignmentId;
  }
}