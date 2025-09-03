import { Result } from '../../common/Result';
import { UniqueEntityID } from '../../common/Identifier';
import { Assignment, AssignmentStatus } from '../entities/Assignment';
export interface AssignmentFilter {
    teacherId?: string;
    problemSetId?: UniqueEntityID;
    status?: AssignmentStatus;
    dueDateFrom?: Date;
    dueDateTo?: Date;
    isOverdue?: boolean;
}
export interface AssignmentSortOptions {
    field: 'createdAt' | 'updatedAt' | 'dueDate' | 'title';
    direction: 'asc' | 'desc';
}
export interface AssignmentPageResult {
    assignments: Assignment[];
    total: number;
    page: number;
    limit: number;
    hasNext: boolean;
}
export interface IAssignmentRepository {
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
}
//# sourceMappingURL=IAssignmentRepository.d.ts.map