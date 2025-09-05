import { IBatchJobExecutor, BatchJobExecutionResult } from '@woodie/domain/batch/services/IBatchJobExecutor';
import { BatchJob, BatchJobType } from '@woodie/domain/batch/entities/BatchJob';
import { Result } from '@woodie/domain/common/Result';
/**
 * 일별 학습 통계 집계 배치 작업 실행기
 * aggregates.aggregate_daily_learning_stats() 함수를 호출하여 일별 통계를 집계
 */
export declare class DailyStatsAggregationExecutor implements IBatchJobExecutor {
    private readonly databaseClient;
    readonly supportedType: BatchJobType;
    readonly canBeCancelled = false;
    constructor(databaseClient: any);
    validate(job: BatchJob): Result<boolean>;
    estimateExecutionTime(job: BatchJob): number;
    execute(job: BatchJob): Promise<Result<BatchJobExecutionResult>>;
}
//# sourceMappingURL=DailyStatsAggregationExecutor.d.ts.map