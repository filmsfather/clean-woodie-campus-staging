import { Result } from '@woodie/domain/common/Result';
/**
 * 주별 학습 통계 집계 배치 작업 실행기
 * aggregates.aggregate_weekly_learning_stats() 함수를 호출하여 주별 통계를 집계
 */
export class WeeklyStatsAggregationExecutor {
    databaseClient;
    supportedType = 'weekly_stats_aggregation';
    canBeCancelled = false;
    constructor(databaseClient // Supabase 클라이언트나 다른 DB 클라이언트
    ) {
        this.databaseClient = databaseClient;
    }
    validate(job) {
        const config = job.config;
        // 매개변수 검증
        if (!config.parameters) {
            return Result.fail('집계 주 매개변수가 필요합니다');
        }
        const { targetWeekStart } = config.parameters;
        if (!targetWeekStart) {
            return Result.fail('targetWeekStart 매개변수가 필요합니다');
        }
        // 날짜 형식 검증
        const date = new Date(targetWeekStart);
        if (isNaN(date.getTime())) {
            return Result.fail('유효하지 않은 날짜 형식입니다');
        }
        // 주 시작일(월요일) 검증
        const dayOfWeek = date.getDay();
        if (dayOfWeek !== 1) { // 1 = 월요일
            return Result.fail('주 시작일은 월요일이어야 합니다');
        }
        // 미래 주 검증
        const currentWeekStart = this.getCurrentWeekStart();
        if (date > currentWeekStart) {
            return Result.fail('미래 주에 대한 집계는 실행할 수 없습니다');
        }
        return Result.ok(true);
    }
    estimateExecutionTime(job) {
        // 주별 집계는 일별 집계 데이터를 기반으로 하므로 빠름
        // 기본적으로 1000명 기준 약 10초 정도로 추정
        return 10000; // 10초
    }
    async execute(job) {
        const startTime = Date.now();
        let recordsProcessed = 0;
        let recordsSucceeded = 0;
        let recordsFailed = 0;
        try {
            const { targetWeekStart } = job.config.parameters;
            const formattedDate = new Date(targetWeekStart).toISOString().split('T')[0]; // YYYY-MM-DD 형식
            // 주별 집계 실행 전 일별 데이터 존재 여부 확인
            const weekEnd = new Date(targetWeekStart);
            weekEnd.setDate(weekEnd.getDate() + 6); // 주 종료일 (일요일)
            const dailyDataCheck = await this.databaseClient
                .from('aggregates.daily_learning_stats')
                .select('count(*)')
                .gte('date_recorded', formattedDate)
                .lte('date_recorded', weekEnd.toISOString().split('T')[0]);
            const dailyRecordsCount = dailyDataCheck.data?.[0]?.count || 0;
            if (dailyRecordsCount === 0) {
                const executionTime = Date.now() - startTime;
                return Result.fail('해당 주에 대한 일별 집계 데이터가 존재하지 않습니다');
            }
            // PostgreSQL 함수 호출
            const { data, error } = await this.databaseClient
                .rpc('aggregate_weekly_learning_stats', {
                target_week_start: formattedDate
            });
            if (error) {
                return Result.fail(`주별 집계 함수 실행 실패: ${error.message}`);
            }
            recordsProcessed = data || 0;
            recordsSucceeded = data || 0;
            // 추가 정보: 집계된 통계 조회
            const statsQuery = await this.databaseClient
                .from('aggregates.weekly_learning_stats')
                .select('*')
                .eq('week_start_date', formattedDate);
            const weeklyStats = statsQuery.data || [];
            // 주간 통계 요약 계산
            const totalStudyDays = weeklyStats.reduce((sum, stat) => sum + stat.total_study_days, 0);
            const avgConsistencyScore = weeklyStats.length > 0
                ? weeklyStats.reduce((sum, stat) => sum + (stat.consistency_score || 0), 0) / weeklyStats.length
                : 0;
            const executionTime = Date.now() - startTime;
            const result = {
                recordsProcessed,
                recordsSucceeded,
                recordsFailed,
                executionTimeMs: executionTime,
                additionalInfo: {
                    targetWeekStart: formattedDate,
                    targetWeekEnd: weekEnd.toISOString().split('T')[0],
                    weeklyStatsGenerated: weeklyStats.length,
                    totalStudyDays,
                    avgConsistencyScore: Math.round(avgConsistencyScore * 100) / 100,
                    dailyRecordsProcessed: dailyRecordsCount
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
                errorMessage: `주별 통계 집계 실행 중 오류: ${error}`,
                additionalInfo: {
                    targetWeekStart: job.config.parameters.targetWeekStart,
                    error: error instanceof Error ? error.message : String(error)
                }
            };
            return Result.fail(`주별 통계 집계 실패: ${error}`);
        }
    }
    /**
     * 현재 주의 시작일(월요일) 계산
     */
    getCurrentWeekStart() {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // 일요일이면 -6, 아니면 1에서 요일 빼기
        const monday = new Date(today);
        monday.setDate(today.getDate() + mondayOffset);
        monday.setHours(0, 0, 0, 0);
        return monday;
    }
}
//# sourceMappingURL=WeeklyStatsAggregationExecutor.js.map