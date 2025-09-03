import { UniqueEntityID } from '@woodie/domain/common/Identifier';
import { ReviewSchedule, ReviewState, ReviewInterval, EaseFactor } from '@woodie/domain/srs';
import { BaseRepository } from '../repositories/BaseRepository';
export class SupabaseReviewScheduleRepository extends BaseRepository {
    client; // Supabase client
    tableName = 'review_schedules';
    schema = 'learning';
    constructor(client) {
        super();
        this.client = client;
    }
    async findById(id) {
        const { data, error } = await this.client
            .from(`${this.schema}.${this.tableName}`)
            .select('*')
            .eq('id', id.toString())
            .single();
        if (error || !data) {
            return null;
        }
        return this.toDomain(data);
    }
    async findByStudentAndProblem(studentId, problemId) {
        const { data, error } = await this.client
            .from(`${this.schema}.${this.tableName}`)
            .select('*')
            .eq('student_id', studentId.toString())
            .eq('problem_id', problemId.toString())
            .single();
        if (error || !data) {
            return null;
        }
        return this.toDomain(data);
    }
    async findDueReviews(studentId, dueDate) {
        const { data, error } = await this.client
            .from(`${this.schema}.${this.tableName}`)
            .select('*')
            .eq('student_id', studentId.toString())
            .lte('next_review_at', dueDate.toISOString())
            .order('next_review_at', { ascending: true })
            .order('ease_factor', { ascending: true });
        if (error || !data) {
            return [];
        }
        return data.map((row) => this.toDomain(row));
    }
    async findTodayReviews(studentId, currentDate) {
        const endOfDay = new Date(currentDate);
        endOfDay.setHours(23, 59, 59, 999);
        const { data, error } = await this.client
            .from(`${this.schema}.${this.tableName}`)
            .select('*')
            .eq('student_id', studentId.toString())
            .lte('next_review_at', endOfDay.toISOString())
            .order('next_review_at', { ascending: true })
            .order('ease_factor', { ascending: true }); // 어려운 것부터
        if (error || !data) {
            return [];
        }
        return data.map((row) => this.toDomain(row));
    }
    async findOverdueReviews(studentId, currentDate) {
        const yesterdayEnd = new Date(currentDate);
        yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
        yesterdayEnd.setHours(23, 59, 59, 999);
        const { data, error } = await this.client
            .from(`${this.schema}.${this.tableName}`)
            .select('*')
            .eq('student_id', studentId.toString())
            .lt('next_review_at', yesterdayEnd.toISOString())
            .order('next_review_at', { ascending: true });
        if (error || !data) {
            return [];
        }
        return data.map((row) => this.toDomain(row));
    }
    async save(reviewSchedule) {
        const persistence = this.toPersistence(reviewSchedule);
        const { error } = await this.client
            .from(`${this.schema}.${this.tableName}`)
            .upsert(persistence, {
            onConflict: 'id',
            ignoreDuplicates: false
        });
        if (error) {
            throw new Error(`Failed to save review schedule: ${error.message}`);
        }
    }
    async delete(id) {
        const { error } = await this.client
            .from(`${this.schema}.${this.tableName}`)
            .delete()
            .eq('id', id.toString());
        if (error) {
            throw new Error(`Failed to delete review schedule: ${error.message}`);
        }
    }
    async countByStudent(studentId) {
        const { count, error } = await this.client
            .from(`${this.schema}.${this.tableName}`)
            .select('id', { count: 'exact' })
            .eq('student_id', studentId.toString());
        if (error) {
            throw new Error(`Failed to count review schedules: ${error.message}`);
        }
        return count || 0;
    }
    async countByStudentAndStatus(studentId, status) {
        const currentDate = new Date();
        let query = this.client
            .from(`${this.schema}.${this.tableName}`)
            .select('id', { count: 'exact' })
            .eq('student_id', studentId.toString());
        switch (status) {
            case 'due':
                query = query.lte('next_review_at', currentDate.toISOString());
                break;
            case 'overdue':
                const yesterday = new Date(currentDate);
                yesterday.setDate(yesterday.getDate() - 1);
                query = query.lt('next_review_at', yesterday.toISOString());
                break;
            case 'upcoming':
                query = query.gt('next_review_at', currentDate.toISOString());
                break;
        }
        const { count, error } = await query;
        if (error) {
            throw new Error(`Failed to count review schedules by status: ${error.message}`);
        }
        return count || 0;
    }
    toDomain(row) {
        const intervalResult = ReviewInterval.create(row.current_interval);
        if (intervalResult.isFailure) {
            throw new Error(`Invalid interval: ${intervalResult.error}`);
        }
        const easeFactorResult = EaseFactor.create(row.ease_factor);
        if (easeFactorResult.isFailure) {
            throw new Error(`Invalid ease factor: ${easeFactorResult.error}`);
        }
        const reviewStateResult = ReviewState.create({
            interval: intervalResult.getValue(),
            easeFactor: easeFactorResult.getValue(),
            reviewCount: row.review_count,
            lastReviewedAt: row.last_reviewed_at ? new Date(row.last_reviewed_at) : null,
            nextReviewAt: new Date(row.next_review_at)
        });
        if (reviewStateResult.isFailure) {
            throw new Error(`Invalid review state: ${reviewStateResult.error}`);
        }
        return ReviewSchedule.reconstitute({
            studentId: new UniqueEntityID(row.student_id),
            problemId: new UniqueEntityID(row.problem_id),
            reviewState: reviewStateResult.getValue(),
            consecutiveFailures: row.consecutive_failures,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at)
        }, new UniqueEntityID(row.id));
    }
    toPersistence(reviewSchedule) {
        return {
            id: reviewSchedule.id.toString(),
            student_id: reviewSchedule.studentId.toString(),
            problem_id: reviewSchedule.problemId.toString(),
            current_interval: reviewSchedule.reviewState.interval.days,
            ease_factor: reviewSchedule.reviewState.easeFactor.value,
            review_count: reviewSchedule.reviewState.reviewCount,
            consecutive_failures: reviewSchedule.consecutiveFailures,
            last_reviewed_at: reviewSchedule.reviewState.lastReviewedAt?.toISOString() || null,
            next_review_at: reviewSchedule.reviewState.nextReviewAt.toISOString(),
            created_at: reviewSchedule.createdAt.toISOString(),
            updated_at: reviewSchedule.updatedAt.toISOString()
        };
    }
}
//# sourceMappingURL=SupabaseReviewScheduleRepository.js.map