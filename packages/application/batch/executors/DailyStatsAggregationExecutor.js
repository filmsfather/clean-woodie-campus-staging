import { Result } from '@woodie/domain/common/Result';
/**
 * 일별 학습 통계 집계 배치 작업 실행기
 * aggregates.aggregate_daily_learning_stats() 함수를 호출하여 일별 통계를 집계
 */
export class DailyStatsAggregationExecutor {
    databaseClient;
    supportedType = 'daily_stats_aggregation';
    canBeCancelled = false;
    constructor(databaseClient // Supabase 클라이언트나 다른 DB 클라이언트
    ) {
        this.databaseClient = databaseClient;
    }
    validate(job) {
        const config = job.config;
        // 매개변수 검증
        if (!config.parameters) {
            return Result.fail('집계 날짜 매개변수가 필요합니다');
        }
        const { targetDate } = config.parameters;
        if (!targetDate) {
            return Result.fail('targetDate 매개변수가 필요합니다');
        }
        // 날짜 형식 검증
        const date = new Date(targetDate);
        if (isNaN(date.getTime())) {
            return Result.fail('유효하지 않은 날짜 형식입니다');
        }
        // 미래 날짜 검증
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (date > today) {
            return Result.fail('미래 날짜에 대한 집계는 실행할 수 없습니다');
        }
        return Result.ok(true);
    }
    estimateExecutionTime(job) {
        // 경험적으로 측정된 시간 (학생 수에 따라 다름)
        // 기본적으로 1000명 기준 약 30초 정도로 추정
        return 30000; // 30초
    }
    async execute(job) {
        const startTime = Date.now();
        let recordsProcessed = 0;
        let recordsSucceeded = 0;
        let recordsFailed = 0;
        try {
            const { targetDate } = job.config.parameters;
            const formattedDate = new Date(targetDate).toISOString().split('T')[0]; // YYYY-MM-DD 형식
            // PostgreSQL 함수 호출
            const { data, error } = await this.databaseClient
                .rpc('aggregate_daily_learning_stats', {
                target_date: formattedDate
            });
            if (error) {
                const executionTime = Date.now() - startTime;
                return Result.fail(`집계 함수 실행 실패: ${error.message}`);
            }
            recordsProcessed = data || 0;
            recordsSucceeded = data || 0;
            // 추가 정보: 집계된 통계 조회
            const statsQuery = await this.databaseClient
                .from('aggregates.daily_learning_stats')
                .select('count(*)')
                .eq('date_recorded', formattedDate);
            const totalStats = statsQuery.data?.[0]?.count || 0;
            const executionTime = Date.now() - startTime;
            const result = {
                recordsProcessed,
                recordsSucceeded,
                recordsFailed,
                executionTimeMs: executionTime,
                additionalInfo: {
                    targetDate: formattedDate,
                    totalStatsGenerated: totalStats,
                    avgProcessingTimePerRecord: recordsProcessed > 0 ? executionTime / recordsProcessed : 0
                }
            };
            return Result.ok(result);
        }
        catch (error) {
            const executionTime = Date.now() - startTime;
            const result = {
                recordsProcessed,
                recordsSucceeded,
                recordsFailed: recordsProcessed - recordsSucceeded,
                executionTimeMs: executionTime,
                errorMessage: `일별 통계 집계 실행 중 오류: ${error}`,
                additionalInfo: {
                    targetDate: job.config.parameters.targetDate,
                    error: error instanceof Error ? error.message : String(error)
                }
            };
            return Result.fail(`일별 통계 집계 실패: ${error}`);
        }
    }
}
//# sourceMappingURL=DailyStatsAggregationExecutor.js.map