export interface DomainEvent {
  readonly occurredOn: Date
  readonly eventId: string
  readonly eventType: string
}

export abstract class BaseDomainEvent implements DomainEvent {
  public readonly occurredOn: Date
  public readonly eventId: string
  public abstract readonly eventType: string

  constructor() {
    this.occurredOn = new Date()
    this.eventId = this.generateUniqueId()
  }

  private generateUniqueId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}