import { BaseDomainEvent } from '../../events/DomainEvent'
import { UniqueEntityID } from '../../common/Identifier'

export class ReviewScheduledEvent extends BaseDomainEvent {
  public readonly eventType = 'ReviewScheduled'
  
  constructor(
    public readonly reviewScheduleId: UniqueEntityID,
    public readonly studentId: UniqueEntityID,
    public readonly problemId: UniqueEntityID,
    public readonly scheduledAt: Date
  ) {
    super()
  }
}