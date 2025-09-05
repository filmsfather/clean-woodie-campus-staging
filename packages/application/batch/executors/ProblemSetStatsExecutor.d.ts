import { IBatchJobExecutor, BatchJobExecutionResult } from '@woodie/domain/batch/services/IBatchJobExecutor';
import { BatchJob, BatchJobType } from '@woodie/domain/batch/entities/BatchJob';
import { Result } from '@woodie/domain/common/Result';
/**
 * 문제집 통계 집계 배치 작업 실행기
 * aggregates.aggregate_problem_set_stats() 함수를 호출하여 문제집별 통계를 집계
 */
export declare class ProblemSetStatsExecutor implements IBatchJobExecutor {
    private readonly databaseClient;
    readonly supportedType: BatchJobType;
    readonly canBeCancelled = false;
    constructor(databaseClient: any);
    validate(job: BatchJob): Result<boolean>;
    estimateExecutionTime(job: BatchJob): number;
    execute(job: BatchJob): Promise<Result<BatchJobExecutionResult>>;
    /**
     * 개별 문제집 통계 업데이트 (특정 문제집 처리용)
     */
    private updateProblemSetStats;
    /**
     * 문제집별 통계 계산
     */
    private calculateProblemSetStats;
}
//# sourceMappingURL=ProblemSetStatsExecutor.d.ts.map