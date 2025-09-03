import { Result } from '@woodie/domain/common/Result'
import { UniqueEntityID } from '@woodie/domain/common/Identifier'
import { Statistics, IStatisticsRepository } from '@woodie/domain/progress'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

interface StatisticsRow {
  id: string
  student_id: string
  problem_set_id: string
  total_problems: number
  completed_problems: number
  correct_answers: number
  total_time_spent: number // bigint in milliseconds
  average_response_time: number // bigint in milliseconds
  created_at: string
  updated_at: string
}

/**
 * Supabase 기반 Statistics 리포지토리 구현체
 * Domain 인터페이스를 Infrastructure에서 구현
 */
export class SupabaseStatisticsRepository implements IStatisticsRepository {
  private readonly tableName = 'statistics'
  private readonly schema = 'progress'
  private client: SupabaseClient

  constructor(client: SupabaseClient) {
    this.client = client
  }

  /**
   * 학생 ID와 문제집 ID로 통계 조회
   */
  async findByStudentAndProblemSet(
    studentId: UniqueEntityID, 
    problemSetId: UniqueEntityID
  ): Promise<Result<Statistics | null>> {
    try {
      const { data, error } = await this.client
        .from(`${this.schema}.${this.tableName}`)
        .select('*')
        .eq('student_id', studentId.toString())
        .eq('problem_set_id', problemSetId.toString())
        .single()

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          return Result.ok<Statistics | null>(null)
        }
        return Result.fail<Statistics | null>(`Failed to find statistics: ${error.message}`)
      }

      if (!data) {
        return Result.ok<Statistics | null>(null)
      }

      const domainResult = this.toDomain(data)
      if (domainResult.isFailure) {
        return Result.fail<Statistics | null>(domainResult.error)
      }

      return Result.ok<Statistics | null>(domainResult.value)
    } catch (err) {
      return Result.fail<Statistics | null>(`Unexpected error finding statistics: ${err}`)
    }
  }

  /**
   * 학생의 모든 문제집 통계 조회
   */
  async findByStudentId(studentId: UniqueEntityID): Promise<Result<Statistics[]>> {
    try {
      const { data, error } = await this.client
        .from(`${this.schema}.${this.tableName}`)
        .select('*')
        .eq('student_id', studentId.toString())
        .order('created_at', { ascending: false })

      if (error) {
        return Result.fail<Statistics[]>(`Failed to find statistics by student: ${error.message}`)
      }

      if (!data) {
        return Result.ok<Statistics[]>([])
      }

      const domainResults = await Promise.all(
        data.map(row => this.toDomain(row))
      )

      const failures = domainResults.filter(result => result.isFailure)
      if (failures.length > 0) {
        return Result.fail<Statistics[]>(`Failed to convert some statistics: ${failures[0].error}`)
      }

      const statistics = domainResults.map(result => result.value)
      return Result.ok<Statistics[]>(statistics)
    } catch (err) {
      return Result.fail<Statistics[]>(`Unexpected error finding statistics by student: ${err}`)
    }
  }

  /**
   * 문제집별 모든 학생 통계 조회
   */
  async findByProblemSetId(problemSetId: UniqueEntityID): Promise<Result<Statistics[]>> {
    try {
      const { data, error } = await this.client
        .from(`${this.schema}.${this.tableName}`)
        .select('*')
        .eq('problem_set_id', problemSetId.toString())
        .order('created_at', { ascending: false })

      if (error) {
        return Result.fail<Statistics[]>(`Failed to find statistics by problem set: ${error.message}`)
      }

      if (!data) {
        return Result.ok<Statistics[]>([])
      }

      const domainResults = await Promise.all(
        data.map(row => this.toDomain(row))
      )

      const failures = domainResults.filter(result => result.isFailure)
      if (failures.length > 0) {
        return Result.fail<Statistics[]>(`Failed to convert some statistics: ${failures[0].error}`)
      }

      const statistics = domainResults.map(result => result.value)
      return Result.ok<Statistics[]>(statistics)
    } catch (err) {
      return Result.fail<Statistics[]>(`Unexpected error finding statistics by problem set: ${err}`)
    }
  }

  /**
   * 통계 저장 (생성 또는 업데이트)
   */
  async save(statistics: Statistics): Promise<Result<void>> {
    try {
      const persistence = this.toPersistence(statistics)

      // upsert 사용 (student_id, problem_set_id가 unique constraint이므로)
      const { error } = await this.client
        .from(`${this.schema}.${this.tableName}`)
        .upsert(persistence, {
          onConflict: 'student_id,problem_set_id'
        })

      if (error) {
        return Result.fail<void>(`Failed to save statistics: ${error.message}`)
      }

      return Result.ok<void>()
    } catch (err) {
      return Result.fail<void>(`Unexpected error saving statistics: ${err}`)
    }
  }

  /**
   * 통계 삭제
   */
  async delete(statisticsId: UniqueEntityID): Promise<Result<void>> {
    try {
      const { error } = await this.client
        .from(`${this.schema}.${this.tableName}`)
        .delete()
        .eq('id', statisticsId.toString())

      if (error) {
        return Result.fail<void>(`Failed to delete statistics: ${error.message}`)
      }

      return Result.ok<void>()
    } catch (err) {
      return Result.fail<void>(`Unexpected error deleting statistics: ${err}`)
    }
  }

  /**
   * 클래스별 통계 조회
   */
  async findByClassId(classId: string, problemSetId?: UniqueEntityID): Promise<Result<Statistics[]>> {
    try {
      let query = this.client
        .from(`${this.schema}.${this.tableName}`)
        .select(`
          *,
          profiles!inner (
            id,
            class_enrollments!inner (
              class_id
            )
          )
        `)
        .eq('profiles.class_enrollments.class_id', classId)

      if (problemSetId) {
        query = query.eq('problem_set_id', problemSetId.toString())
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) {
        return Result.fail<Statistics[]>(`Failed to find statistics by class: ${error.message}`)
      }

      if (!data) {
        return Result.ok<Statistics[]>([])
      }

      const domainResults = await Promise.all(
        data.map(row => this.toDomain(row))
      )

      const failures = domainResults.filter(result => result.isFailure)
      if (failures.length > 0) {
        return Result.fail<Statistics[]>(`Failed to convert some statistics: ${failures[0].error}`)
      }

      const statistics = domainResults.map(result => result.value)
      return Result.ok<Statistics[]>(statistics)
    } catch (err) {
      return Result.fail<Statistics[]>(`Unexpected error finding statistics by class: ${err}`)
    }
  }

  /**
   * 완료율 기준 상위 학생 조회
   */
  async findTopByCompletionRate(problemSetId: UniqueEntityID, limit: number = 10): Promise<Result<Statistics[]>> {
    try {
      const { data, error } = await this.client
        .from(`${this.schema}.${this.tableName}`)
        .select('*')
        .eq('problem_set_id', problemSetId.toString())
        .order('completed_problems', { ascending: false })
        .order('total_problems', { ascending: true }) // 같은 완료 수라면 총 문제가 적은 것이 더 높은 비율
        .limit(limit)

      if (error) {
        return Result.fail<Statistics[]>(`Failed to find top by completion rate: ${error.message}`)
      }

      if (!data) {
        return Result.ok<Statistics[]>([])
      }

      const domainResults = await Promise.all(
        data.map(row => this.toDomain(row))
      )

      const failures = domainResults.filter(result => result.isFailure)
      if (failures.length > 0) {
        return Result.fail<Statistics[]>(`Failed to convert some statistics: ${failures[0].error}`)
      }

      const statistics = domainResults.map(result => result.value)
      // 도메인에서 완료율 계산으로 정렬
      statistics.sort((a, b) => b.getCompletionRate() - a.getCompletionRate())
      
      return Result.ok<Statistics[]>(statistics.slice(0, limit))
    } catch (err) {
      return Result.fail<Statistics[]>(`Unexpected error finding top by completion rate: ${err}`)
    }
  }

  /**
   * 정답률 기준 상위 학생 조회
   */
  async findTopByAccuracyRate(problemSetId: UniqueEntityID, limit: number = 10): Promise<Result<Statistics[]>> {
    try {
      const { data, error } = await this.client
        .from(`${this.schema}.${this.tableName}`)
        .select('*')
        .eq('problem_set_id', problemSetId.toString())
        .gt('completed_problems', 0) // 완료한 문제가 있는 학생만
        .order('correct_answers', { ascending: false })
        .order('completed_problems', { ascending: true }) // 같은 정답 수라면 완료 문제가 적은 것이 더 높은 비율
        .limit(limit * 2) // 정확한 정답률 계산을 위해 더 많이 가져옴

      if (error) {
        return Result.fail<Statistics[]>(`Failed to find top by accuracy rate: ${error.message}`)
      }

      if (!data) {
        return Result.ok<Statistics[]>([])
      }

      const domainResults = await Promise.all(
        data.map(row => this.toDomain(row))
      )

      const failures = domainResults.filter(result => result.isFailure)
      if (failures.length > 0) {
        return Result.fail<Statistics[]>(`Failed to convert some statistics: ${failures[0].error}`)
      }

      const statistics = domainResults.map(result => result.value)
      // 도메인에서 정답률 계산으로 정렬
      statistics.sort((a, b) => b.getAccuracyRate() - a.getAccuracyRate())
      
      return Result.ok<Statistics[]>(statistics.slice(0, limit))
    } catch (err) {
      return Result.fail<Statistics[]>(`Unexpected error finding top by accuracy rate: ${err}`)
    }
  }

  /**
   * 특정 기간 내 생성된 통계 조회
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<Result<Statistics[]>> {
    try {
      const { data, error } = await this.client
        .from(`${this.schema}.${this.tableName}`)
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false })

      if (error) {
        return Result.fail<Statistics[]>(`Failed to find statistics by date range: ${error.message}`)
      }

      if (!data) {
        return Result.ok<Statistics[]>([])
      }

      const domainResults = await Promise.all(
        data.map(row => this.toDomain(row))
      )

      const failures = domainResults.filter(result => result.isFailure)
      if (failures.length > 0) {
        return Result.fail<Statistics[]>(`Failed to convert some statistics: ${failures[0].error}`)
      }

      const statistics = domainResults.map(result => result.value)
      return Result.ok<Statistics[]>(statistics)
    } catch (err) {
      return Result.fail<Statistics[]>(`Unexpected error finding statistics by date range: ${err}`)
    }
  }

  /**
   * 문제집별 평균 통계 계산
   */
  async calculateAverageStatistics(problemSetId: UniqueEntityID): Promise<Result<{
    averageCompletionRate: number
    averageAccuracyRate: number
    averageResponseTime: number
    totalStudents: number
  }>> {
    try {
      const statisticsResult = await this.findByProblemSetId(problemSetId)
      if (statisticsResult.isFailure) {
        return Result.fail(statisticsResult.error)
      }

      const statistics = statisticsResult.value
      if (statistics.length === 0) {
        return Result.ok({
          averageCompletionRate: 0,
          averageAccuracyRate: 0,
          averageResponseTime: 0,
          totalStudents: 0
        })
      }

      const totalCompletionRate = statistics.reduce((sum, stat) => sum + stat.getCompletionRate(), 0)
      const totalAccuracyRate = statistics.reduce((sum, stat) => sum + stat.getAccuracyRate(), 0)
      const totalResponseTime = statistics.reduce((sum, stat) => sum + stat.averageResponseTime, 0)

      return Result.ok({
        averageCompletionRate: totalCompletionRate / statistics.length,
        averageAccuracyRate: totalAccuracyRate / statistics.length,
        averageResponseTime: totalResponseTime / statistics.length,
        totalStudents: statistics.length
      })
    } catch (err) {
      return Result.fail(`Unexpected error calculating average statistics: ${err}`)
    }
  }

  /**
   * 데이터베이스 행을 도메인 엔티티로 변환
   */
  private toDomain(row: StatisticsRow): Result<Statistics> {
    try {
      const statistics = Statistics.reconstitute({
        studentId: new UniqueEntityID(row.student_id),
        problemSetId: new UniqueEntityID(row.problem_set_id),
        totalProblems: row.total_problems,
        completedProblems: row.completed_problems,
        correctAnswers: row.correct_answers,
        totalTimeSpent: row.total_time_spent,
        averageResponseTime: row.average_response_time,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      }, new UniqueEntityID(row.id))
      
      return Result.ok<Statistics>(statistics)
    } catch (err) {
      return Result.fail<Statistics>(`Failed to convert row to domain: ${err}`)
    }
  }

  /**
   * 도메인 엔티티를 데이터베이스 행으로 변환
   */
  private toPersistence(statistics: Statistics): Record<string, any> {
    return {
      id: statistics.id.toString(),
      student_id: statistics.studentId.toString(),
      problem_set_id: statistics.problemSetId.toString(),
      total_problems: statistics.totalProblems,
      completed_problems: statistics.completedProblems,
      correct_answers: statistics.correctAnswers,
      total_time_spent: statistics.totalTimeSpent,
      average_response_time: statistics.averageResponseTime,
      created_at: statistics.createdAt.toISOString(),
      updated_at: statistics.updatedAt.toISOString()
    }
  }
}