import { BaseDomainEvent } from '../../events/DomainEvent';
/**
 * 배치 작업 완료 이벤트
 * 배치 작업이 성공적으로 완료되었을 때 발생하는 도메인 이벤트
 */
export class BatchJobCompletedEvent extends BaseDomainEvent {
    eventType = 'BatchJobCompletedEvent';
    aggregateId;
    name;
    type;
    durationMs;
    result;
    constructor(aggregateId, name, type, durationMs, result) {
        super();
        this.aggregateId = aggregateId;
        this.name = name;
        this.type = type;
        this.durationMs = durationMs;
        this.result = result;
    }
    getAggregateId() {
        return this.aggregateId;
    }
    /**
     * 작업 성공 여부 확인
     */
    isSuccessful() {
        return this.result.recordsFailed === 0 && !this.result.errorMessage;
    }
    /**
     * 성공률 계산
     */
    getSuccessRate() {
        if (this.result.recordsProcessed === 0)
            return 100;
        return (this.result.recordsSucceeded / this.result.recordsProcessed) * 100;
    }
}
//# sourceMappingURL=BatchJobCompletedEvent.js.map