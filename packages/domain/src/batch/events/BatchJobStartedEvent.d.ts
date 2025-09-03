import { BaseDomainEvent } from '../../events/DomainEvent';
import { UniqueEntityID } from '../../common/Identifier';
import { BatchJobType } from '../entities/BatchJob';
/**
 * 배치 작업 시작 이벤트
 * 배치 작업이 실행을 시작할 때 발생하는 도메인 이벤트
 */
export declare class BatchJobStartedEvent extends BaseDomainEvent {
    readonly eventType: string;
    readonly aggregateId: UniqueEntityID;
    readonly name: string;
    readonly type: BatchJobType;
    readonly startedAt: Date;
    constructor(aggregateId: UniqueEntityID, name: string, type: BatchJobType, startedAt: Date);
    getAggregateId(): UniqueEntityID;
}
//# sourceMappingURL=BatchJobStartedEvent.d.ts.map