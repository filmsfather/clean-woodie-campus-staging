import { IBatchJobExecutor, BatchJobExecutionResult } from '@woodie/domain/batch/services/IBatchJobExecutor';
import { BatchJob, BatchJobType } from '@woodie/domain/batch/entities/BatchJob';
import { Result } from '@woodie/domain/common/Result';
/**
 * 주별 학습 통계 집계 배치 작업 실행기
 * aggregates.aggregate_weekly_learning_stats() 함수를 호출하여 주별 통계를 집계
 */
export declare class WeeklyStatsAggregationExecutor implements IBatchJobExecutor {
    private readonly databaseClient;
    readonly supportedType: BatchJobType;
    readonly canBeCancelled = false;
    constructor(databaseClient: any);
    validate(job: BatchJob): Result<boolean>;
    estimateExecutionTime(job: BatchJob): number;
    execute(job: BatchJob): Promise<Result<BatchJobExecutionResult>>;
    /**
     * 현재 주의 시작일(월요일) 계산
     */
    private getCurrentWeekStart;
}
//# sourceMappingURL=WeeklyStatsAggregationExecutor.d.ts.map