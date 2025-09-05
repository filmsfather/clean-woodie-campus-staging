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
 * 배치 작업 완료 이벤트
 * 배치 작업이 성공적으로 완료되었을 때 발생하는 도메인 이벤트
 */
export declare class BatchJobCompletedEvent extends BaseDomainEvent {
    readonly eventType: string;
    readonly name: string;
    readonly type: BatchJobType;
    readonly durationMs: number;
    readonly result: BatchJobResult;
    constructor(aggregateId: UniqueEntityID, name: string, type: BatchJobType, durationMs: number, result: BatchJobResult);
    /**
     * 작업 성공 여부 확인
     */
    isSuccessful(): boolean;
    /**
     * 성공률 계산
     */
    getSuccessRate(): number;
}
export {};
//# sourceMappingURL=BatchJobCompletedEvent.d.ts.map