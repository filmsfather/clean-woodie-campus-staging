import { AggregateRoot } from '../../aggregates/AggregateRoot'
import { UniqueEntityID } from '../../common/Identifier'
import { Result } from '../../common/Result'
import { Guard } from '../../common/Guard'
import { BatchJobStartedEvent } from '../events/BatchJobStartedEvent'
import { BatchJobCompletedEvent } from '../events/BatchJobCompletedEvent'
import { BatchJobFailedEvent } from '../events/BatchJobFailedEvent'

/**
 * 배치 작업 상태
 */
export type BatchJobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

/**
 * 배치 작업 유형
 */
export type BatchJobType = 
  | 'daily_stats_aggregation'    // 일별 학습 통계 집계
  | 'weekly_stats_aggregation'   // 주별 학습 통계 집계
  | 'problem_set_stats'          // 문제집 통계 집계
  | 'system_stats'               // 시스템 통계 집계
  | 'data_cleanup'               // 오래된 데이터 정리
  | 'cache_warming'              // 캐시 워밍

/**
 * 배치 작업 결과 정보
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
 * 배치 작업 설정
 */
interface BatchJobConfig {
  retryAttempts: number
  timeoutMs: number
  parameters: Record<string, any>
}

interface BatchJobProps {
  name: string
  type: BatchJobType
  status: BatchJobStatus
  config: BatchJobConfig
  scheduledAt: Date
  startedAt?: Date
  completedAt?: Date
  result?: BatchJobResult
  createdAt: Date
  updatedAt: Date
}

/**
 * 배치 작업 엔티티
 * 백그라운드에서 실행되는 데이터 처리 작업을 관리
 */
export class BatchJob extends AggregateRoot<UniqueEntityID> {
  private constructor(private props: BatchJobProps, id?: UniqueEntityID) {
    super(id || new UniqueEntityID())
  }

  get name(): string {
    return this.props.name
  }

  get type(): BatchJobType {
    return this.props.type
  }

  get status(): BatchJobStatus {
    return this.props.status
  }

  get config(): BatchJobConfig {
    return this.props.config
  }

  get scheduledAt(): Date {
    return this.props.scheduledAt
  }

  get startedAt(): Date | undefined {
    return this.props.startedAt
  }

  get completedAt(): Date | undefined {
    return this.props.completedAt
  }

  get result(): BatchJobResult | undefined {
    return this.props.result
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  /**
   * 작업이 실행 가능한 상태인지 확인
   */
  public canStart(): boolean {
    return this.props.status === 'pending' && this.props.scheduledAt <= new Date()
  }

  /**
   * 작업이 완료된 상태인지 확인
   */
  public isCompleted(): boolean {
    return ['completed', 'failed', 'cancelled'].includes(this.props.status)
  }

  /**
   * 작업이 실행 중인지 확인
   */
  public isRunning(): boolean {
    return this.props.status === 'running'
  }

  /**
   * 작업 실행 시작
   */
  public start(): Result<void> {
    if (!this.canStart()) {
      return Result.fail<void>('배치 작업을 시작할 수 없는 상태입니다')
    }

    const now = new Date()
    this.props.status = 'running'
    this.props.startedAt = now
    this.props.updatedAt = now

    // 작업 시작 이벤트 발행
    this.addDomainEvent(new BatchJobStartedEvent(
      this.id,
      this.props.name,
      this.props.type,
      now
    ))

    return Result.ok<void>()
  }

  /**
   * 작업 성공적 완료
   */
  public complete(result: BatchJobResult): Result<void> {
    if (!this.isRunning()) {
      return Result.fail<void>('실행 중이지 않은 작업을 완료할 수 없습니다')
    }

    const now = new Date()
    this.props.status = 'completed'
    this.props.completedAt = now
    this.props.result = result
    this.props.updatedAt = now

    // 작업 완료 이벤트 발행
    this.addDomainEvent(new BatchJobCompletedEvent(
      this.id,
      this.props.name,
      this.props.type,
      this.calculateDuration(),
      result
    ))

    return Result.ok<void>()
  }

  /**
   * 작업 실패 처리
   */
  public fail(errorMessage: string, partialResult?: Partial<BatchJobResult>): Result<void> {
    if (!this.isRunning()) {
      return Result.fail<void>('실행 중이지 않은 작업을 실패 처리할 수 없습니다')
    }

    const now = new Date()
    this.props.status = 'failed'
    this.props.completedAt = now
    this.props.result = {
      recordsProcessed: partialResult?.recordsProcessed || 0,
      recordsSucceeded: partialResult?.recordsSucceeded || 0,
      recordsFailed: partialResult?.recordsFailed || 0,
      executionTimeMs: this.calculateDuration(),
      errorMessage,
      additionalInfo: partialResult?.additionalInfo
    }
    this.props.updatedAt = now

    // 작업 실패 이벤트 발행
    this.addDomainEvent(new BatchJobFailedEvent(
      this.id,
      this.props.name,
      this.props.type,
      errorMessage,
      this.props.result
    ))

    return Result.ok<void>()
  }

  /**
   * 작업 취소
   */
  public cancel(): Result<void> {
    if (this.isCompleted()) {
      return Result.fail<void>('이미 완료된 작업은 취소할 수 없습니다')
    }

    const now = new Date()
    this.props.status = 'cancelled'
    this.props.completedAt = now
    this.props.updatedAt = now

    return Result.ok<void>()
  }

  /**
   * 작업 재시도를 위한 초기화
   */
  public resetForRetry(): Result<void> {
    if (!['failed', 'cancelled'].includes(this.props.status)) {
      return Result.fail<void>('재시도할 수 없는 작업 상태입니다')
    }

    const now = new Date()
    this.props.status = 'pending'
    this.props.startedAt = undefined
    this.props.completedAt = undefined
    this.props.result = undefined
    this.props.updatedAt = now

    return Result.ok<void>()
  }

  /**
   * 실행 시간 계산 (밀리초)
   */
  public calculateDuration(): number {
    if (!this.props.startedAt) return 0
    
    const endTime = this.props.completedAt || new Date()
    return endTime.getTime() - this.props.startedAt.getTime()
  }

  /**
   * 작업 성공률 계산
   */
  public getSuccessRate(): number {
    if (!this.props.result || this.props.result.recordsProcessed === 0) {
      return 0
    }
    
    return (this.props.result.recordsSucceeded / this.props.result.recordsProcessed) * 100
  }

  /**
   * 타임아웃 확인
   */
  public isTimedOut(): boolean {
    if (!this.isRunning() || !this.props.startedAt) {
      return false
    }

    const elapsed = new Date().getTime() - this.props.startedAt.getTime()
    return elapsed > this.props.config.timeoutMs
  }

  /**
   * BatchJob 생성
   */
  public static create(props: {
    name: string
    type: BatchJobType
    config: BatchJobConfig
    scheduledAt: Date
  }, id?: UniqueEntityID): Result<BatchJob> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.name, argumentName: 'name' },
      { argument: props.type, argumentName: 'type' },
      { argument: props.config, argumentName: 'config' },
      { argument: props.scheduledAt, argumentName: 'scheduledAt' }
    ])

    if (guardResult.isFailure) {
      return Result.fail<BatchJob>(guardResult.error)
    }

    // 이름 검증
    if (props.name.trim().length === 0) {
      return Result.fail<BatchJob>('작업 이름은 비워둘 수 없습니다')
    }

    // 설정 검증
    if (props.config.retryAttempts < 0) {
      return Result.fail<BatchJob>('재시도 횟수는 음수가 될 수 없습니다')
    }

    if (props.config.timeoutMs <= 0) {
      return Result.fail<BatchJob>('타임아웃은 0보다 커야 합니다')
    }

    const now = new Date()

    const batchJob = new BatchJob({
      name: props.name.trim(),
      type: props.type,
      status: 'pending',
      config: props.config,
      scheduledAt: props.scheduledAt,
      createdAt: now,
      updatedAt: now
    }, id)

    return Result.ok<BatchJob>(batchJob)
  }

  /**
   * 재구성 팩토리 메서드 (DB에서 복원할 때 사용)
   */
  public static reconstitute(
    props: BatchJobProps,
    id: UniqueEntityID
  ): BatchJob {
    return new BatchJob(props, id)
  }
}