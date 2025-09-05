import { AggregateRoot } from '../../aggregates/AggregateRoot';
import { UniqueEntityID } from '../../common/Identifier';
import { Result } from '../../common/Result';
/**
 * 배치 작업 상태
 */
export type BatchJobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
/**
 * 배치 작업 유형
 */
export type BatchJobType = 'daily_stats_aggregation' | 'weekly_stats_aggregation' | 'problem_set_stats' | 'system_stats' | 'data_cleanup' | 'cache_warming';
/**
 * 배치 작업 결과 정보
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
 * 배치 작업 설정
 */
interface BatchJobConfig {
    retryAttempts: number;
    timeoutMs: number;
    parameters: Record<string, any>;
}
interface BatchJobProps {
    name: string;
    type: BatchJobType;
    status: BatchJobStatus;
    config: BatchJobConfig;
    scheduledAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    result?: BatchJobResult;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * 배치 작업 엔티티
 * 백그라운드에서 실행되는 데이터 처리 작업을 관리
 */
export declare class BatchJob extends AggregateRoot<BatchJobProps> {
    private constructor();
    get name(): string;
    get type(): BatchJobType;
    get status(): BatchJobStatus;
    get config(): BatchJobConfig;
    get scheduledAt(): Date;
    get startedAt(): Date | undefined;
    get completedAt(): Date | undefined;
    get result(): BatchJobResult | undefined;
    get createdAt(): Date;
    get updatedAt(): Date;
    /**
     * 작업이 실행 가능한 상태인지 확인
     */
    canStart(): boolean;
    /**
     * 작업이 완료된 상태인지 확인
     */
    isCompleted(): boolean;
    /**
     * 작업이 실행 중인지 확인
     */
    isRunning(): boolean;
    /**
     * 작업 실행 시작
     */
    start(): Result<void>;
    /**
     * 작업 성공적 완료
     */
    complete(result: BatchJobResult): Result<void>;
    /**
     * 작업 실패 처리
     */
    fail(errorMessage: string, partialResult?: Partial<BatchJobResult>): Result<void>;
    /**
     * 작업 취소
     */
    cancel(): Result<void>;
    /**
     * 작업 재시도를 위한 초기화
     */
    resetForRetry(): Result<void>;
    /**
     * 실행 시간 계산 (밀리초)
     */
    calculateDuration(): number;
    /**
     * 작업 성공률 계산
     */
    getSuccessRate(): number;
    /**
     * 타임아웃 확인
     */
    isTimedOut(): boolean;
    /**
     * BatchJob 생성
     */
    static create(props: {
        name: string;
        type: BatchJobType;
        config: BatchJobConfig;
        scheduledAt: Date;
    }, id?: UniqueEntityID): Result<BatchJob>;
    /**
     * 재구성 팩토리 메서드 (DB에서 복원할 때 사용)
     */
    static reconstitute(props: BatchJobProps, id: UniqueEntityID): BatchJob;
}
export {};
//# sourceMappingURL=BatchJob.d.ts.map