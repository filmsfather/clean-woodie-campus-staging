import { UniqueEntityID } from '@woodie/domain/common/Identifier'
import { StudyRecord, ReviewFeedback, ReviewFeedbackType, IStudyRecordRepository } from '@woodie/domain/srs'
import { BaseRepository } from '../repositories/BaseRepository'

interface StudyRecordRow {
  id: string
  student_id: string
  problem_id: string
  feedback: ReviewFeedbackType
  is_correct: boolean
  response_time?: number
  answer_content?: any
  created_at: string
}

/**
 * Supabase 기반 StudyRecord 리포지토리 구현체
 * Domain 인터페이스를 Infrastructure에서 구현
 */
export class SupabaseStudyRecordRepository extends BaseRepository<StudyRecord> implements IStudyRecordRepository {
  protected client: any
  private readonly tableName = 'study_records'
  private readonly schema = 'learning'

  constructor(client: any) {
    super()
    this.client = client
  }

  async findById(id: UniqueEntityID): Promise<StudyRecord | null> {
    const { data, error } = await this.client
      .from(`${this.schema}.${this.tableName}`)
      .select('*')
      .eq('id', id.toString())
      .single()

    if (error || !data) {
      return null
    }

    return this.toDomain(data)
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const { error } = await this.client
      .from(`${this.schema}.${this.tableName}`)
      .delete()
      .eq('id', id.toString())

    if (error) {
      throw new Error(`Failed to delete study record: ${error.message}`)
    }
  }

  async save(record: StudyRecord): Promise<void> {
    const persistence = this.toPersistence(record)

    const { error } = await this.client
      .from(`${this.schema}.${this.tableName}`)
      .insert(persistence)

    if (error) {
      throw new Error(`Failed to save study record: ${error.message}`)
    }
  }

  async findByStudent(studentId: UniqueEntityID, limit = 50): Promise<StudyRecord[]> {
    const { data, error } = await this.client
      .from(`${this.schema}.${this.tableName}`)
      .select('*')
      .eq('student_id', studentId.toString())
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error || !data) {
      return []
    }

    return data.map((row: StudyRecordRow) => this.toDomain(row))
  }

  async findByProblem(problemId: UniqueEntityID, limit = 50): Promise<StudyRecord[]> {
    const { data, error } = await this.client
      .from(`${this.schema}.${this.tableName}`)
      .select('*')
      .eq('problem_id', problemId.toString())
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error || !data) {
      return []
    }

    return data.map((row: StudyRecordRow) => this.toDomain(row))
  }

  async findByStudentAndProblem(
    studentId: UniqueEntityID, 
    problemId: UniqueEntityID
  ): Promise<StudyRecord[]> {
    const { data, error } = await this.client
      .from(`${this.schema}.${this.tableName}`)
      .select('*')
      .eq('student_id', studentId.toString())
      .eq('problem_id', problemId.toString())
      .order('created_at', { ascending: false })

    if (error || !data) {
      return []
    }

    return data.map((row: StudyRecordRow) => this.toDomain(row))
  }

  async countByStudent(studentId: UniqueEntityID): Promise<number> {
    const { count, error } = await this.client
      .from(`${this.schema}.${this.tableName}`)
      .select('id', { count: 'exact' })
      .eq('student_id', studentId.toString())

    if (error) {
      throw new Error(`Failed to count study records: ${error.message}`)
    }

    return count || 0
  }

  async findByDateRange(
    studentId: UniqueEntityID,
    startDate: Date,
    endDate: Date
  ): Promise<StudyRecord[]> {
    const { data, error } = await this.client
      .from(`${this.schema}.${this.tableName}`)
      .select('*')
      .eq('student_id', studentId.toString())
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false })

    if (error || !data) {
      return []
    }

    return data.map((row: StudyRecordRow) => this.toDomain(row))
  }

  private toDomain(row: StudyRecordRow): StudyRecord {
    const feedbackResult = ReviewFeedback.create(row.feedback)
    if (feedbackResult.isFailure) {
      throw new Error(`Invalid feedback: ${feedbackResult.error}`)
    }

    // Domain 엔티티로 재구성
    return StudyRecord.reconstitute({
      studentId: new UniqueEntityID(row.student_id),
      problemId: new UniqueEntityID(row.problem_id),
      feedback: feedbackResult.getValue(),
      isCorrect: row.is_correct,
      responseTime: row.response_time,
      answerContent: row.answer_content,
      createdAt: new Date(row.created_at)
    }, new UniqueEntityID(row.id))
  }

  private toPersistence(record: StudyRecord): Record<string, any> {
    return {
      id: record.id.toString(),
      student_id: record.studentId.toString(),
      problem_id: record.problemId.toString(),
      feedback: record.feedback.value,
      is_correct: record.isCorrect,
      response_time: record.responseTime,
      answer_content: record.answerContent,
      created_at: record.createdAt.toISOString()
    }
  }
}