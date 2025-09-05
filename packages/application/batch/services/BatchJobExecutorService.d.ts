import { IBatchJobExecutor, BatchJobExecutionResult } from '@woodie/domain/batch/services/IBatchJobExecutor';
import { IBatchJobRepository } from '@woodie/domain/batch/repositories/IBatchJobRepository';
import { BatchJob, BatchJobType } from '@woodie/domain/batch/entities/BatchJob';
import { Result } from '@woodie/domain/common/Result';
import { UniqueEntityID } from '@woodie/domain/common/Identifier';
import { IEventDispatcher } from '@woodie/domain/events/IEventDispatcher';
/**
 * 배치 작업 실행 서비스
 * 다양한 타입의 배치 작업 실행기들을 관리하고 실행을 조율
 */
export declare class BatchJobExecutorService {
    private readonly batchJobRepository;
    private readonly eventDispatcher;
    private readonly executors;
    constructor(batchJobRepository: IBatchJobRepository, eventDispatcher: IEventDispatcher);
    /**
     * 배치 작업 실행기 등록
     */
    registerExecutor(executor: IBatchJobExecutor): void;
    /**
     * 등록된 실행기들 조회
     */
    getRegisteredExecutors(): BatchJobType[];
    /**
     * 특정 타입의 실행기 존재 여부 확인
     */
    hasExecutorForType(type: BatchJobType): boolean;
    /**
     * 실행 가능한 배치 작업들을 조회하고 실행
     */
    processAvailableJobs(maxJobs?: number): Promise<Result<{
        processed: number;
        succeeded: number;
        failed: number;
        details: Array<{
            jobId: string;
            type: BatchJobType;
            status: 'success' | 'failure';
            error?: string;
        }>;
    }>>;
    /**
     * 단일 배치 작업 실행
     */
    executeJob(job: BatchJob): Promise<Result<BatchJobExecutionResult>>;
    /**
     * 타임아웃된 작업들 정리
     */
    handleTimedOutJobs(): Promise<Result<number>>;
    /**
     * 특정 작업 취소
     */
    cancelJob(jobId: UniqueEntityID): Promise<Result<void>>;
    /**
     * 실패한 작업 재시도
     */
    retryFailedJob(jobId: UniqueEntityID): Promise<Result<void>>;
    /**
     * 작업 실패 처리 헬퍼 메서드
     */
    private handleJobFailure;
    /**
     * 작업 저장 및 이벤트 발행 헬퍼 메서드
     */
    private saveJobAndDispatchEvents;
}
//# sourceMappingURL=BatchJobExecutorService.d.ts.map