import { DomainEvent, BaseDomainEvent } from '../../events/DomainEvent'
import { UniqueEntityID } from '../../common/Identifier'
import { BatchJobType } from '../entities/BatchJob'

/**
 * 배치 작업 시작 이벤트
 * 배치 작업이 실행을 시작할 때 발생하는 도메인 이벤트
 */
export class BatchJobStartedEvent extends BaseDomainEvent {
  public readonly eventType: string = 'BatchJobStartedEvent'
  public readonly aggregateId: UniqueEntityID
  public readonly name: string
  public readonly type: BatchJobType
  public readonly startedAt: Date

  constructor(
    aggregateId: UniqueEntityID,
    name: string,
    type: BatchJobType,
    startedAt: Date
  ) {
    super()
    this.aggregateId = aggregateId
    this.name = name
    this.type = type
    this.startedAt = startedAt
  }

  getAggregateId(): UniqueEntityID {
    return this.aggregateId
  }
}