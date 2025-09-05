import { UniqueEntityID } from '@woodie/domain/common/Identifier';
import { StudyRecord, ReviewFeedback } from '@woodie/domain/srs';
/**
 * Supabase 기반 StudyRecord 리포지토리 구현체
 * Domain 인터페이스를 Infrastructure에서 구현
 */
export class SupabaseStudyRecordRepository {
    client;
    tableName = 'study_records';
    schema = 'learning';
    constructor(client) {
        this.client = client;
    }
    async save(record) {
        const persistence = this.toPersistence(record);
        const { error } = await this.client
            .from(`${this.schema}.${this.tableName}`)
            .insert(persistence);
        if (error) {
            throw new Error(`Failed to save study record: ${error.message}`);
        }
    }
    // Missing interface methods
    async findByStudentId(studentId, limit) {
        return this.findByStudent(studentId, limit);
    }
    async findByProblemId(problemId, limit) {
        return this.findByProblem(problemId, limit);
    }
    async countByStudent(studentId) {
        const { count, error } = await this.client
            .from(`${this.schema}.${this.tableName}`)
            .select('id', { count: 'exact' })
            .eq('student_id', studentId.toString());
        if (error) {
            throw new Error(`Failed to count study records: ${error.message}`);
        }
        return count || 0;
    }
    async countByStudentId(studentId) {
        return this.countByStudent(studentId);
    }
    async findByDateRange(studentId, startDate, endDate) {
        const { data, error } = await this.client
            .from(`${this.schema}.${this.tableName}`)
            .select('*')
            .eq('student_id', studentId.toString())
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString())
            .order('created_at', { ascending: false });
        if (error || !data) {
            return [];
        }
        return data.map((row) => this.toDomain(row));
    }
    async findByStudent(studentId, limit = 50) {
        const { data, error } = await this.client
            .from(`${this.schema}.${this.tableName}`)
            .select('*')
            .eq('student_id', studentId.toString())
            .order('created_at', { ascending: false })
            .limit(limit);
        if (error || !data) {
            return [];
        }
        return data.map((row) => this.toDomain(row));
    }
    async findByProblem(problemId, limit = 50) {
        const { data, error } = await this.client
            .from(`${this.schema}.${this.tableName}`)
            .select('*')
            .eq('problem_id', problemId.toString())
            .order('created_at', { ascending: false })
            .limit(limit);
        if (error || !data) {
            return [];
        }
        return data.map((row) => this.toDomain(row));
    }
    async findByStudentAndProblem(studentId, problemId) {
        const { data, error } = await this.client
            .from(`${this.schema}.${this.tableName}`)
            .select('*')
            .eq('student_id', studentId.toString())
            .eq('problem_id', problemId.toString())
            .order('created_at', { ascending: false });
        if (error || !data) {
            return [];
        }
        return data.map((row) => this.toDomain(row));
    }
    toDomain(row) {
        const feedbackResult = ReviewFeedback.create(row.feedback);
        if (feedbackResult.isFailure) {
            throw new Error(`Invalid feedback: ${feedbackResult.error}`);
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
        }, new UniqueEntityID(row.id));
    }
    toPersistence(record) {
        return {
            id: record.id.toString(),
            student_id: record.studentId.toString(),
            problem_id: record.problemId.toString(),
            feedback: record.feedback.value,
            is_correct: record.isCorrect,
            response_time: record.responseTime,
            answer_content: record.answerContent,
            created_at: record.createdAt.toISOString()
        };
    }
}
//# sourceMappingURL=SupabaseStudyRecordRepository.js.map