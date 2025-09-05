import { Result } from '@woodie/domain';
import { IAssignmentRepository, AssignmentService } from '@woodie/domain';
import { UseCase } from '../../use-cases/UseCase';
export interface GetTeacherAssignmentsInput {
    teacherId: string;
    status?: string;
    includeArchived?: boolean;
    sortBy?: 'dueDate' | 'createdAt' | 'title' | 'status';
    sortOrder?: 'asc' | 'desc';
}
export interface TeacherAssignmentSummary {
    id: string;
    title: string;
    description?: string;
    dueDate: Date;
    maxAttempts?: number;
    status: string;
    problemSetId: string;
    teacherId: string;
    createdAt: Date;
    updatedAt: Date;
    dueDateStatus: {
        isOverdue: boolean;
        isDueSoon: boolean;
        hoursUntilDue: number;
        daysUntilDue: number;
        statusMessage: string;
    };
    targetInfo: {
        totalTargets: number;
        activeTargets: number;
        assignedClasses: string[];
        assignedStudents: string[];
        hasActiveAssignments: boolean;
    };
    permissions: {
        canActivate: boolean;
        canEdit: boolean;
        canDelete: boolean;
        canAssign: boolean;
    };
}
export interface GetTeacherAssignmentsOutput {
    teacherId: string;
    assignments: TeacherAssignmentSummary[];
    summary: {
        totalCount: number;
        draftCount: number;
        activeCount: number;
        closedCount: number;
        archivedCount: number;
        overdueCount: number;
        dueSoonCount: number;
    };
}
export declare class GetTeacherAssignmentsUseCase implements UseCase<GetTeacherAssignmentsInput, GetTeacherAssignmentsOutput> {
    private assignmentRepository;
    private assignmentService;
    constructor(assignmentRepository: IAssignmentRepository, assignmentService: AssignmentService);
    execute(request: GetTeacherAssignmentsInput): Promise<Result<GetTeacherAssignmentsOutput>>;
}
//# sourceMappingURL=GetTeacherAssignmentsUseCase.d.ts.map