import { BaseDomainEvent } from '../../events/DomainEvent';
import { UniqueEntityID } from '../../common/Identifier';
import { AssignmentTargetType } from '../value-objects/AssignmentTargetIdentifier';

// 과제 배정 취소 이벤트
export class AssignmentTargetRevokedEvent extends BaseDomainEvent {
  public readonly eventType = 'AssignmentTargetRevoked'
  public readonly assignmentId: UniqueEntityID;
  public readonly targetType: AssignmentTargetType;
  public readonly targetId: string;
  public readonly revokedBy: string;
  public readonly revokedAt: Date;

  constructor(
    assignmentId: UniqueEntityID,
    targetType: AssignmentTargetType,
    targetId: string,
    revokedBy: string,
    revokedAt: Date = new Date()
  ) {
    super();
    this.assignmentId = assignmentId;
    this.targetType = targetType;
    this.targetId = targetId;
    this.revokedBy = revokedBy;
    this.revokedAt = revokedAt;
  }

  public getAggregateId(): UniqueEntityID {
    return this.assignmentId;
  }
}