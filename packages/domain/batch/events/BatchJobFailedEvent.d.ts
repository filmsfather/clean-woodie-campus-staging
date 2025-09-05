import { BaseDomainEvent } from '../../events/DomainEvent';
import { UniqueEntityID } from '../../common/Identifier';
import { BatchJobType } from '../entities/BatchJob';
/**
 * 배치 작업 결과 정보 (이벤트용)
 */
interface BatchJobResult {
    recordsProcessed: number;
    recordsSucceeded: number;
    recordsFailed: number;
    executionTimeMs: number;
    errorMessage?: string;
    additionalInfo?: Record<string, any>;
}
/**
 * 배치 작업 실패 이벤트
 * 배치 작업이 실패했을 때 발생하는 도메인 이벤트
 */
export declare class BatchJobFailedEvent extends BaseDomainEvent {
    readonly eventType: string;
    readonly name: string;
    readonly type: BatchJobType;
    readonly errorMessage: string;
    readonly result?: BatchJobResult;
    constructor(aggregateId: UniqueEntityID, name: string, type: BatchJobType, errorMessage: string, result?: BatchJobResult);
    /**
     * 부분적 성공 여부 확인
     */
    hasPartialSuccess(): boolean;
    /**
     * 완전 실패 여부 확인
     */
    isCompleteFailure(): boolean;
}
export {};
//# sourceMappingURL=BatchJobFailedEvent.d.ts.map