import { DomainEvent } from './DomainEvent';
import { UniqueEntityID } from '../common/Identifier';

export interface IEventStore {
  saveEvent(event: DomainEvent): Promise<void>;
  saveEvents(events: DomainEvent[]): Promise<void>;
  
  getEvents(
    aggregateId: UniqueEntityID,
    fromVersion?: number
  ): Promise<DomainEvent[]>;
  
  getAllEvents(
    fromEventId?: UniqueEntityID,
    limit?: number
  ): Promise<DomainEvent[]>;
}