import { Entity } from '../entities/Entity'
import { DomainEvent } from '../events/DomainEvent'

export abstract class AggregateRoot<T> extends Entity<T> {
  private _domainEvents: DomainEvent[] = []

  get domainEvents(): readonly DomainEvent[] {
    return this._domainEvents
  }

  protected addDomainEvent(domainEvent: DomainEvent): void {
    this._domainEvents.push(domainEvent)
  }

  clearEvents(): void {
    this._domainEvents.length = 0
  }

  markEventsForDispatch(): void {
    this._domainEvents.forEach(event => this.addDomainEvent(event))
  }

  getUncommittedEvents(): readonly DomainEvent[] {
    return this._domainEvents
  }

  markEventsAsCommitted(): void {
    this.clearEvents()
  }
}