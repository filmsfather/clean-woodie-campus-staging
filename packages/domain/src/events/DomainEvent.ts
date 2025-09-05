import { UniqueEntityID } from '../common/Identifier'

export interface DomainEvent {
  readonly occurredOn: Date
  readonly eventId: UniqueEntityID
  readonly eventType: string
  readonly aggregateId: UniqueEntityID
  readonly eventVersion: number
  readonly metadata?: Record<string, any>
  readonly correlationId?: string
  readonly causationId?: string
}

export abstract class BaseDomainEvent implements DomainEvent {
  public readonly occurredOn: Date
  public readonly eventId: UniqueEntityID
  public abstract readonly eventType: string
  public readonly aggregateId: UniqueEntityID
  public readonly eventVersion: number
  public readonly metadata?: Record<string, any>
  public readonly correlationId?: string
  public readonly causationId?: string

  constructor(
    aggregateId: UniqueEntityID,
    eventVersion: number = 1,
    metadata?: Record<string, any>,
    correlationId?: string,
    causationId?: string
  ) {
    this.occurredOn = new Date()
    this.eventId = new UniqueEntityID()
    this.aggregateId = aggregateId
    this.eventVersion = eventVersion
    this.metadata = metadata
    this.correlationId = correlationId
    this.causationId = causationId
  }
}