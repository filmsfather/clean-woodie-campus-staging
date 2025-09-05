import { Result } from '../../common/Result';
import { BatchJob, BatchJobType } from '../entities/BatchJob';
/**
 * 배치 작업 실행 결과
 */
export interface BatchJobExecutionResult {
    recordsProcessed: number;
    recordsSucceeded: number;
    recordsFailed: number;
    executionTimeMs: number;
    errorMessage?: string;
    additionalInfo?: Record<string, any>;
}
/**
 * 배치 작업 실행기 인터페이스
 * 특정 타입의 배치 작업을 실제로 실행하는 계약을 정의
 */
export interface IBatchJobExecutor {
    /**
     * 지원하는 배치 작업 타입
     */
    readonly supportedType: BatchJobType;
    /**
     * 배치 작업 실행
     * @param job 실행할 배치 작업
     * @returns 실행 결과
     */
    execute(job: BatchJob): Promise<Result<BatchJobExecutionResult>>;
    /**
     * 실행 전 유효성 검사
     * @param job 검사할 배치 작업
     * @returns 유효성 검사 결과
     */
    validate(job: BatchJob): Result<boolean>;
    /**
     * 예상 실행 시간 계산 (밀리초)
     * @param job 배치 작업
     * @returns 예상 실행 시간
     */
    estimateExecutionTime(job: BatchJob): number;
    /**
     * 실행 중 취소 가능 여부
     */
    readonly canBeCancelled: boolean;
    /**
     * 배치 작업 취소 처리
     * @param job 취소할 배치 작업
     * @returns 취소 결과
     */
    cancel?(job: BatchJob): Promise<Result<void>>;
}
//# sourceMappingURL=IBatchJobExecutor.d.ts.map