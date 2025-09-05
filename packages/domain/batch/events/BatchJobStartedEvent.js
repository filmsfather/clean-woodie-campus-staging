import { BaseDomainEvent } from '../../events/DomainEvent';
/**
 * 배치 작업 시작 이벤트
 * 배치 작업이 실행을 시작할 때 발생하는 도메인 이벤트
 */
export class BatchJobStartedEvent extends BaseDomainEvent {
    eventType = 'BatchJobStartedEvent';
    name;
    type;
    startedAt;
    constructor(aggregateId, name, type, startedAt) {
        super(aggregateId);
        this.name = name;
        this.type = type;
        this.startedAt = startedAt;
    }
}
//# sourceMappingURL=BatchJobStartedEvent.js.map