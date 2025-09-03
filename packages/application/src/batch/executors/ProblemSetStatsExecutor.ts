import { IBatchJobExecutor, BatchJobExecutionResult } from '@woodie/domain/batch/services/IBatchJobExecutor'
import { BatchJob, BatchJobType } from '@woodie/domain/batch/entities/BatchJob'
import { Result } from '@woodie/domain/common/Result'

/**
 * 문제집 통계 집계 배치 작업 실행기
 * aggregates.aggregate_problem_set_stats() 함수를 호출하여 문제집별 통계를 집계
 */
export class ProblemSetStatsExecutor implements IBatchJobExecutor {
  public readonly supportedType: BatchJobType = 'problem_set_stats'
  public readonly canBeCancelled = false

  constructor(
    private readonly databaseClient: any // Supabase 클라이언트나 다른 DB 클라이언트
  ) {}

  public validate(job: BatchJob): Result<boolean> {
    const config = job.config
    
    // 선택적 매개변수 검증
    if (config.parameters?.specificProblemSetIds) {
      const { specificProblemSetIds } = config.parameters
      
      if (!Array.isArray(specificProblemSetIds)) {
        return Result.fail('specificProblemSetIds는 배열이어야 합니다')
      }

      // UUID 형식 검증
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      for (const id of specificProblemSetIds) {
        if (!uuidRegex.test(id)) {
          return Result.fail(`유효하지 않은 UUID 형식: ${id}`)
        }
      }
    }

    return Result.ok(true)
  }

  public estimateExecutionTime(job: BatchJob): number {
    // 문제집 통계는 복잡한 집계를 수행하므로 시간이 오래 걸림
    // 문제집 수와 학생 수에 따라 다르지만 기본적으로 60초 정도로 추정
    const { specificProblemSetIds } = job.config.parameters || {}
    
    if (specificProblemSetIds && Array.isArray(specificProblemSetIds)) {
      // 특정 문제집들만 처리하는 경우
      return specificProblemSetIds.length * 5000 // 문제집당 5초
    } else {
      // 모든 문제집 처리하는 경우
      return 60000 // 60초
    }
  }

  public async execute(job: BatchJob): Promise<Result<BatchJobExecutionResult>> {
    const startTime = Date.now()
    let recordsProcessed = 0
    let recordsSucceeded = 0
    let recordsFailed = 0

    try {
      const { specificProblemSetIds, includeInactive = false } = job.config.parameters || {}

      // 특정 문제집들만 처리하는 경우
      if (specificProblemSetIds && Array.isArray(specificProblemSetIds)) {
        for (const problemSetId of specificProblemSetIds) {
          try {
            recordsProcessed++
            
            // 개별 문제집 통계 업데이트
            await this.updateProblemSetStats(problemSetId)
            recordsSucceeded++
            
          } catch (error) {
            recordsFailed++
            console.error(`문제집 ${problemSetId} 통계 업데이트 실패:`, error)
          }
        }
      } else {
        // 모든 활성 문제집에 대해 통계 집계
        const { data, error } = await this.databaseClient
          .rpc('aggregate_problem_set_stats')

        if (error) {
          return Result.fail<BatchJobExecutionResult>(`문제집 통계 집계 함수 실행 실패: ${error.message}`)
        }

        recordsProcessed = data || 0
        recordsSucceeded = data || 0
      }

      // 추가 정보: 업데이트된 통계 조회
      const statsQuery = await this.databaseClient
        .from('aggregates.problem_set_stats')
        .select(`
          problem_set_id,
          total_students,
          avg_completion_rate,
          avg_accuracy_rate,
          estimated_difficulty_score,
          last_activity_at
        `)
        .order('stats_updated_at', { ascending: false })
        .limit(10)

      const recentStats = statsQuery.data || []

      // 전체 통계 요약
      const summaryQuery = await this.databaseClient
        .from('aggregates.problem_set_stats')
        .select(`
          count(*) as total_problem_sets,
          avg(avg_completion_rate) as system_avg_completion_rate,
          avg(avg_accuracy_rate) as system_avg_accuracy_rate,
          avg(estimated_difficulty_score) as system_avg_difficulty
        `)

      const summary = summaryQuery.data?.[0] || {}

      const executionTime = Date.now() - startTime
      
      const result: BatchJobExecutionResult = {
        recordsProcessed,
        recordsSucceeded,
        recordsFailed,
        executionTimeMs: executionTime,
        additionalInfo: {
          processingMode: specificProblemSetIds ? 'specific' : 'all',
          processedProblemSets: specificProblemSetIds || 'all_active',
          systemStats: {
            totalProblemSets: summary.total_problem_sets || 0,
            avgCompletionRate: Math.round((summary.system_avg_completion_rate || 0) * 100) / 100,
            avgAccuracyRate: Math.round((summary.system_avg_accuracy_rate || 0) * 100) / 100,
            avgDifficultyScore: Math.round((summary.system_avg_difficulty || 0) * 100) / 100
          },
          recentlyUpdatedStats: recentStats.slice(0, 5), // 최근 업데이트된 5개만
          avgProcessingTimePerRecord: recordsProcessed > 0 ? executionTime / recordsProcessed : 0
        }
      }

      return Result.ok(result)

    } catch (error) {
      const executionTime = Date.now() - startTime
      
      const result: BatchJobExecutionResult = {
        recordsProcessed,
        recordsSucceeded,
        recordsFailed: recordsProcessed - recordsSucceeded,
        executionTimeMs: executionTime,
        errorMessage: `문제집 통계 집계 실행 중 오류: ${error}`,
        additionalInfo: {
          processingMode: job.config.parameters?.specificProblemSetIds ? 'specific' : 'all',
          error: error instanceof Error ? error.message : String(error)
        }
      }

      return Result.fail<BatchJobExecutionResult>(`문제집 통계 집계 실패: ${error}`)
    }
  }

  /**
   * 개별 문제집 통계 업데이트 (특정 문제집 처리용)
   */
  private async updateProblemSetStats(problemSetId: string): Promise<void> {
    // 특정 문제집에 대한 통계 재계산
    const statsData = await this.calculateProblemSetStats(problemSetId)
    
    // UPSERT 방식으로 업데이트
    const { error } = await this.databaseClient
      .from('aggregates.problem_set_stats')
      .upsert({
        problem_set_id: problemSetId,
        ...statsData,
        stats_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (error) {
      throw new Error(`문제집 ${problemSetId} 통계 업데이트 실패: ${error.message}`)
    }
  }

  /**
   * 문제집별 통계 계산
   */
  private async calculateProblemSetStats(problemSetId: string): Promise<any> {
    const { data: statistics } = await this.databaseClient
      .from('progress.statistics')
      .select('*')
      .eq('problem_set_id', problemSetId)

    if (!statistics || statistics.length === 0) {
      return {
        total_students: 0,
        active_students_last_7days: 0,
        active_students_last_30days: 0,
        students_completed: 0,
        avg_completion_rate: 0,
        avg_accuracy_rate: 0,
        estimated_difficulty_score: 50 // 중간 값
      }
    }

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const totalStudents = statistics.length
    const activeStudents7Days = statistics.filter((s: any) => new Date(s.updated_at) >= sevenDaysAgo).length
    const activeStudents30Days = statistics.filter((s: any) => new Date(s.updated_at) >= thirtyDaysAgo).length
    const completedStudents = statistics.filter((s: any) => s.completed_problems === s.total_problems && s.total_problems > 0).length

    const avgCompletionRate = statistics.reduce((sum: number, s: any) => {
      return sum + (s.total_problems > 0 ? (s.completed_problems / s.total_problems) * 100 : 0)
    }, 0) / totalStudents

    const avgAccuracyRate = statistics.reduce((sum: number, s: any) => {
      return sum + (s.completed_problems > 0 ? (s.correct_answers / s.completed_problems) * 100 : 0)
    }, 0) / totalStudents

    // 추정 난이도: 낮은 정답률 = 높은 난이도
    const estimatedDifficulty = 100 - avgAccuracyRate

    return {
      total_students: totalStudents,
      active_students_last_7days: activeStudents7Days,
      active_students_last_30days: activeStudents30Days,
      students_completed: completedStudents,
      avg_completion_rate: Math.round(avgCompletionRate * 100) / 100,
      avg_accuracy_rate: Math.round(avgAccuracyRate * 100) / 100,
      estimated_difficulty_score: Math.max(0, Math.min(100, Math.round(estimatedDifficulty * 100) / 100)),
      last_activity_at: statistics.reduce((latest: Date | null, s: any) => {
        const updatedAt = new Date(s.updated_at)
        return !latest || updatedAt > latest ? updatedAt : latest
      }, null as Date | null)?.toISOString()
    }
  }
}