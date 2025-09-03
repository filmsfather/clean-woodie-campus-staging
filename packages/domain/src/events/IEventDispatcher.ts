import { DomainEvent } from './DomainEvent'

/**
 * 도메인 이벤트 디스패처 인터페이스
 * 도메인 이벤트를 외부 시스템으로 전파하는 역할
 */
export interface IEventDispatcher {
  dispatch(event: DomainEvent): Promise<void>
  dispatchAll(events: DomainEvent[]): Promise<void>
}