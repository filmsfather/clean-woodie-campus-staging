import { BaseDomainEvent } from '../../events/DomainEvent';
/**
 * 배치 작업 실패 이벤트
 * 배치 작업이 실패했을 때 발생하는 도메인 이벤트
 */
export class BatchJobFailedEvent extends BaseDomainEvent {
    eventType = 'BatchJobFailedEvent';
    name;
    type;
    errorMessage;
    result;
    constructor(aggregateId, name, type, errorMessage, result) {
        super(aggregateId);
        this.name = name;
        this.type = type;
        this.errorMessage = errorMessage;
        this.result = result;
    }
    /**
     * 부분적 성공 여부 확인
     */
    hasPartialSuccess() {
        return this.result ? this.result.recordsSucceeded > 0 : false;
    }
    /**
     * 완전 실패 여부 확인
     */
    isCompleteFailure() {
        return this.result ? this.result.recordsSucceeded === 0 : true;
    }
}
//# sourceMappingURL=BatchJobFailedEvent.js.map