import { DomainEvent } from '../../events/DomainEvent'
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
 * 배치 작업 완료 이벤트
 * 배치 작업이 성공적으로 완료되었을 때 발생하는 도메인 이벤트
 */
export class BatchJobCompletedEvent implements DomainEvent {
  public readonly occurredAt: Date
  public readonly aggregateId: UniqueEntityID
  public readonly name: string
  public readonly type: BatchJobType
  public readonly durationMs: number
  public readonly result: BatchJobResult

  constructor(
    aggregateId: UniqueEntityID,
    name: string,
    type: BatchJobType,
    durationMs: number,
    result: BatchJobResult
  ) {
    this.aggregateId = aggregateId
    this.name = name
    this.type = type
    this.durationMs = durationMs
    this.result = result
    this.occurredAt = new Date()
  }

  getAggregateId(): UniqueEntityID {
    return this.aggregateId
  }

  /**
   * 작업 성공 여부 확인
   */
  public isSuccessful(): boolean {
    return this.result.recordsFailed === 0 && !this.result.errorMessage
  }

  /**
   * 성공률 계산
   */
  public getSuccessRate(): number {
    if (this.result.recordsProcessed === 0) return 100
    return (this.result.recordsSucceeded / this.result.recordsProcessed) * 100
  }
}