import { Result } from '@domain/common/Result'
import { UniqueEntityID } from '@domain/common/Identifier'
import { StudyStreak, IStudyStreakRepository } from '@domain/progress'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

interface StudyStreakRow {
  id: string
  student_id: string
  current_streak: number
  longest_streak: number
  last_study_date: string // Date as ISO string
  created_at: string
  updated_at: string
}

/**
 * Supabase 기반 StudyStreak 리포지토리 구현체
 * Domain 인터페이스를 Infrastructure에서 구현
 */
export class SupabaseStudyStreakRepository implements IStudyStreakRepository {
  private readonly tableName = 'study_streaks'
  private readonly schema = 'progress'
  private client: SupabaseClient

  constructor(client: SupabaseClient) {
    this.client = client
  }

  /**
   * 학생 ID로 스트릭 조회
   */
  async findByStudentId(studentId: UniqueEntityID): Promise<Result<StudyStreak | null>> {
    try {
      const { data, error } = await this.client
        .from(`${this.schema}.${this.tableName}`)
        .select('*')
        .eq('student_id', studentId.toString())
        .single()

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          return Result.ok<StudyStreak | null>(null)
        }
        return Result.fail<StudyStreak | null>(`Failed to find study streak: ${error.message}`)
      }

      if (!data) {
        return Result.ok<StudyStreak | null>(null)
      }

      const domainResult = this.toDomain(data)
      if (domainResult.isFailure) {
        return Result.fail<StudyStreak | null>(domainResult.error)
      }

      return Result.ok<StudyStreak | null>(domainResult.value)
    } catch (err) {
      return Result.fail<StudyStreak | null>(`Unexpected error finding study streak: ${err}`)
    }
  }

  /**
   * 스트릭 저장 (생성 또는 업데이트)
   */
  async save(studyStreak: StudyStreak): Promise<Result<void>> {
    try {
      const persistence = this.toPersistence(studyStreak)

      // upsert 사용 (student_id가 unique constraint이므로)
      const { error } = await this.client
        .from(`${this.schema}.${this.tableName}`)
        .upsert(persistence, {
          onConflict: 'student_id'
        })

      if (error) {
        return Result.fail<void>(`Failed to save study streak: ${error.message}`)
      }

      return Result.ok<void>()
    } catch (err) {
      return Result.fail<void>(`Unexpected error saving study streak: ${err}`)
    }
  }

  /**
   * 스트릭 삭제
   */
  async delete(studyStreakId: UniqueEntityID): Promise<Result<void>> {
    try {
      const { error } = await this.client
        .from(`${this.schema}.${this.tableName}`)
        .delete()
        .eq('id', studyStreakId.toString())

      if (error) {
        return Result.fail<void>(`Failed to delete study streak: ${error.message}`)
      }

      return Result.ok<void>()
    } catch (err) {
      return Result.fail<void>(`Unexpected error deleting study streak: ${err}`)
    }
  }

  /**
   * 활성 스트릭을 가진 학생들 조회
   */
  async findActiveStreaks(daysThreshold: number = 2): Promise<Result<StudyStreak[]>> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysThreshold)

      const { data, error } = await this.client
        .from(`${this.schema}.${this.tableName}`)
        .select('*')
        .gt('current_streak', 0)
        .gte('last_study_date', cutoffDate.toISOString().split('T')[0]) // Date only
        .order('current_streak', { ascending: false })

      if (error) {
        return Result.fail<StudyStreak[]>(`Failed to find active streaks: ${error.message}`)
      }

      if (!data) {
        return Result.ok<StudyStreak[]>([])
      }

      const domainResults = await Promise.all(
        data.map(row => this.toDomain(row))
      )

      const failures = domainResults.filter(result => result.isFailure)
      if (failures.length > 0) {
        return Result.fail<StudyStreak[]>(`Failed to convert some streaks: ${failures[0].error}`)
      }

      const streaks = domainResults.map(result => result.value)
      return Result.ok<StudyStreak[]>(streaks)
    } catch (err) {
      return Result.fail<StudyStreak[]>(`Unexpected error finding active streaks: ${err}`)
    }
  }

  /**
   * 위험 상태의 스트릭들 조회 (끊어질 위험이 있는)
   */
  async findAtRiskStreaks(): Promise<Result<StudyStreak[]>> {
    try {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]

      const { data, error } = await this.client
        .from(`${this.schema}.${this.tableName}`)
        .select('*')
        .gt('current_streak', 0)
        .eq('last_study_date', yesterdayStr)
        .order('current_streak', { ascending: false })

      if (error) {
        return Result.fail<StudyStreak[]>(`Failed to find at-risk streaks: ${error.message}`)
      }

      if (!data) {
        return Result.ok<StudyStreak[]>([])
      }

      const domainResults = await Promise.all(
        data.map(row => this.toDomain(row))
      )

      const failures = domainResults.filter(result => result.isFailure)
      if (failures.length > 0) {
        return Result.fail<StudyStreak[]>(`Failed to convert some streaks: ${failures[0].error}`)
      }

      const streaks = domainResults.map(result => result.value)
      return Result.ok<StudyStreak[]>(streaks)
    } catch (err) {
      return Result.fail<StudyStreak[]>(`Unexpected error finding at-risk streaks: ${err}`)
    }
  }

  /**
   * 최장 스트릭 순위 조회
   */
  async findTopStreaks(limit: number = 10): Promise<Result<StudyStreak[]>> {
    try {
      const { data, error } = await this.client
        .from(`${this.schema}.${this.tableName}`)
        .select('*')
        .order('longest_streak', { ascending: false })
        .limit(limit)

      if (error) {
        return Result.fail<StudyStreak[]>(`Failed to find top streaks: ${error.message}`)
      }

      if (!data) {
        return Result.ok<StudyStreak[]>([])
      }

      const domainResults = await Promise.all(
        data.map(row => this.toDomain(row))
      )

      const failures = domainResults.filter(result => result.isFailure)
      if (failures.length > 0) {
        return Result.fail<StudyStreak[]>(`Failed to convert some streaks: ${failures[0].error}`)
      }

      const streaks = domainResults.map(result => result.value)
      return Result.ok<StudyStreak[]>(streaks)
    } catch (err) {
      return Result.fail<StudyStreak[]>(`Unexpected error finding top streaks: ${err}`)
    }
  }

  /**
   * 클래스별 스트릭 통계 조회
   */
  async findByClassId(classId: string): Promise<Result<StudyStreak[]>> {
    try {
      const { data, error } = await this.client
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
        .order('current_streak', { ascending: false })

      if (error) {
        return Result.fail<StudyStreak[]>(`Failed to find streaks by class: ${error.message}`)
      }

      if (!data) {
        return Result.ok<StudyStreak[]>([])
      }

      const domainResults = await Promise.all(
        data.map(row => this.toDomain(row))
      )

      const failures = domainResults.filter(result => result.isFailure)
      if (failures.length > 0) {
        return Result.fail<StudyStreak[]>(`Failed to convert some streaks: ${failures[0].error}`)
      }

      const streaks = domainResults.map(result => result.value)
      return Result.ok<StudyStreak[]>(streaks)
    } catch (err) {
      return Result.fail<StudyStreak[]>(`Unexpected error finding streaks by class: ${err}`)
    }
  }

  /**
   * 데이터베이스 행을 도메인 엔티티로 변환
   */
  private toDomain(row: StudyStreakRow): Result<StudyStreak> {
    try {
      return StudyStreak.reconstitute({
        studentId: new UniqueEntityID(row.student_id),
        currentStreak: row.current_streak,
        longestStreak: row.longest_streak,
        lastStudyDate: new Date(row.last_study_date + 'T00:00:00.000Z'), // Date only
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      }, new UniqueEntityID(row.id))
    } catch (err) {
      return Result.fail<StudyStreak>(`Failed to convert row to domain: ${err}`)
    }
  }

  /**
   * 도메인 엔티티를 데이터베이스 행으로 변환
   */
  private toPersistence(studyStreak: StudyStreak): Record<string, any> {
    return {
      id: studyStreak.id.toString(),
      student_id: studyStreak.studentId.toString(),
      current_streak: studyStreak.currentStreak,
      longest_streak: studyStreak.longestStreak,
      last_study_date: studyStreak.lastStudyDate.toISOString().split('T')[0], // Date only
      created_at: studyStreak.createdAt.toISOString(),
      updated_at: studyStreak.updatedAt.toISOString()
    }
  }
}