import { UniqueEntityID } from '@woodie/domain/common/Identifier';
import { IReviewScheduleRepository, ReviewSchedule } from '@woodie/domain/srs';
import { SupabaseClient } from '@supabase/supabase-js';
export declare class SupabaseReviewScheduleRepository implements IReviewScheduleRepository {
    private client;
    private readonly tableName;
    private readonly schema;
    constructor(client: SupabaseClient);
    findById(id: UniqueEntityID): Promise<ReviewSchedule | null>;
    findByStudentAndProblem(studentId: UniqueEntityID, problemId: UniqueEntityID): Promise<ReviewSchedule | null>;
    findDueReviews(studentId: UniqueEntityID, dueDate: Date): Promise<ReviewSchedule[]>;
    findTodayReviews(studentId: UniqueEntityID, currentDate: Date): Promise<ReviewSchedule[]>;
    findByIds(ids: UniqueEntityID[]): Promise<ReviewSchedule[]>;
    findByStudentId(studentId: UniqueEntityID, limit?: number): Promise<ReviewSchedule[]>;
    findByProblemId(problemId: UniqueEntityID, limit?: number): Promise<ReviewSchedule[]>;
    findOverdueByStudentId(studentId: UniqueEntityID, currentDate?: Date): Promise<ReviewSchedule[]>;
    findOverdueSchedules(currentDate?: Date): Promise<ReviewSchedule[]>;
    countOverdueByStudentId(studentId: UniqueEntityID, currentDate?: Date): Promise<number>;
    findOverdueReviews(studentId: UniqueEntityID, currentDate: Date): Promise<ReviewSchedule[]>;
    save(reviewSchedule: ReviewSchedule): Promise<void>;
    delete(id: UniqueEntityID): Promise<void>;
    countByStudent(studentId: UniqueEntityID): Promise<number>;
    countByStudentAndStatus(studentId: UniqueEntityID, status: 'due' | 'overdue' | 'upcoming'): Promise<number>;
    private toDomain;
    private toPersistence;
}
//# sourceMappingURL=SupabaseReviewScheduleRepository.d.ts.map