import { DomainEvent, BaseDomainEvent } from '../../events/DomainEvent'
import { UniqueEntityID } from '../../common/Identifier'
import { BatchJobType } from '../entities/BatchJob'

/**
 * 배치 작업 결과 정보 (이벤트용)
 */
interface BatchJobResult {
  recordsProcessed: number
  recordsSucceeded: number
  recordsFailed: number
  executionTimeMs: number
  errorMessage?: string
  additionalInfo?: Record<string, any>
}

/**
 * 배치 작업 실패 이벤트
 * 배치 작업이 실패했을 때 발생하는 도메인 이벤트
 */
export class BatchJobFailedEvent extends BaseDomainEvent {
  public readonly eventType: string = 'BatchJobFailedEvent'
  public readonly aggregateId: UniqueEntityID
  public readonly name: string
  public readonly type: BatchJobType
  public readonly errorMessage: string
  public readonly result?: BatchJobResult

  constructor(
    aggregateId: UniqueEntityID,
    name: string,
    type: BatchJobType,
    errorMessage: string,
    result?: BatchJobResult
  ) {
    super()
    this.aggregateId = aggregateId
    this.name = name
    this.type = type
    this.errorMessage = errorMessage
    this.result = result
  }

  getAggregateId(): UniqueEntityID {
    return this.aggregateId
  }

  /**
   * 부분적 성공 여부 확인
   */
  public hasPartialSuccess(): boolean {
    return this.result ? this.result.recordsSucceeded > 0 : false
  }

  /**
   * 완전 실패 여부 확인
   */
  public isCompleteFailure(): boolean {
    return this.result ? this.result.recordsSucceeded === 0 : true
  }
}