import { SupabaseClient } from '@supabase/supabase-js';
import { Assignment, AssignmentStatus } from '@woodie/domain/assignments/entities/Assignment';
import { IAssignmentRepository, AssignmentFilter, AssignmentSortOptions, AssignmentPageResult } from '@woodie/domain/assignments/repositories/IAssignmentRepository';
import { Result } from '@woodie/domain/common/Result';
import { UniqueEntityID } from '@woodie/domain/common/Identifier';
export declare class SupabaseAssignmentRepository implements IAssignmentRepository {
    private supabase;
    constructor(supabase: SupabaseClient);
    save(assignment: Assignment): Promise<Result<void>>;
    findById(id: UniqueEntityID): Promise<Result<Assignment>>;
    delete(id: UniqueEntityID): Promise<Result<void>>;
    exists(id: UniqueEntityID): Promise<Result<boolean>>;
    findByTeacherId(teacherId: string): Promise<Result<Assignment[]>>;
    findByProblemSetId(problemSetId: UniqueEntityID): Promise<Result<Assignment[]>>;
    findByStatus(status: AssignmentStatus): Promise<Result<Assignment[]>>;
    findWithFilter(filter: AssignmentFilter, sort?: AssignmentSortOptions, page?: number, limit?: number): Promise<Result<AssignmentPageResult>>;
    findActiveAssignments(teacherId?: string): Promise<Result<Assignment[]>>;
    findAssignmentsDueSoon(daysFromNow: number): Promise<Result<Assignment[]>>;
    countByTeacherAndStatus(teacherId: string, status: AssignmentStatus): Promise<Result<number>>;
    private mapToDomain;
    private mapTargetToDomain;
    private mapSortField;
}
//# sourceMappingURL=SupabaseAssignmentRepository.d.ts.map