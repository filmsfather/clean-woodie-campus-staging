import { UniqueEntityID } from '@domain/common/Identifier';
import { IReviewScheduleRepository, ReviewSchedule } from '@domain/srs';
import { BaseRepository } from '../repositories/BaseRepository';
export declare class SupabaseReviewScheduleRepository extends BaseRepository implements IReviewScheduleRepository {
    private readonly tableName;
    private readonly schema;
    findById(id: UniqueEntityID): Promise<ReviewSchedule | null>;
    findByStudentAndProblem(studentId: UniqueEntityID, problemId: UniqueEntityID): Promise<ReviewSchedule | null>;
    findDueReviews(studentId: UniqueEntityID, dueDate: Date): Promise<ReviewSchedule[]>;
    findTodayReviews(studentId: UniqueEntityID, currentDate: Date): Promise<ReviewSchedule[]>;
    findOverdueReviews(studentId: UniqueEntityID, currentDate: Date): Promise<ReviewSchedule[]>;
    save(reviewSchedule: ReviewSchedule): Promise<void>;
    delete(id: UniqueEntityID): Promise<void>;
    countByStudent(studentId: UniqueEntityID): Promise<number>;
    countByStudentAndStatus(studentId: UniqueEntityID, status: 'due' | 'overdue' | 'upcoming'): Promise<number>;
    private toDomain;
    private toPersistence;
}
//# sourceMappingURL=SupabaseReviewScheduleRepository.d.ts.map