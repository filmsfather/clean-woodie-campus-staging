import { UniqueEntityID } from '@woodie/domain/common/Identifier';
import { IReviewScheduleRepository, ReviewSchedule } from '@woodie/domain/srs';
import { BaseRepository } from '../repositories/BaseRepository';
export declare class SupabaseReviewScheduleRepository extends BaseRepository<ReviewSchedule> implements IReviewScheduleRepository {
    protected client: any;
    private readonly tableName;
    private readonly schema;
    constructor(client: any);
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