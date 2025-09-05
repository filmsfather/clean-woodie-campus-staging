import { Result } from '@woodie/domain';
import { AssignmentService } from '@woodie/domain';
import { UseCase } from '../../use-cases/UseCase';
export interface GetAssignmentsForClassInput {
    classId: string;
    requesterId: string;
    includeInactive?: boolean;
    includeArchived?: boolean;
}
export interface ClassAssignmentSummary {
    id: string;
    title: string;
    description?: string;
    dueDate: Date;
    maxAttempts?: number;
    status: string;
    problemSetId: string;
    teacherId: string;
    createdAt: Date;
    dueDateStatus: {
        isOverdue: boolean;
        isDueSoon: boolean;
        hoursUntilDue: number;
        daysUntilDue: number;
        statusMessage: string;
    };
    targetInfo: {
        totalTargets: number;
        isAssignedToClass: boolean;
        hasIndividualAssignments: boolean;
    };
    accessibility: {
        isAccessible: boolean;
        canSubmit: boolean;
    };
}
export interface GetAssignmentsForClassOutput {
    classId: string;
    assignments: ClassAssignmentSummary[];
    summary: {
        totalCount: number;
        activeCount: number;
        draftCount: number;
        closedCount: number;
        archivedCount: number;
        overdueCount: number;
        dueSoonCount: number;
    };
}
export declare class GetAssignmentsForClassUseCase implements UseCase<GetAssignmentsForClassInput, GetAssignmentsForClassOutput> {
    private assignmentService;
    constructor(assignmentService: AssignmentService);
    execute(request: GetAssignmentsForClassInput): Promise<Result<GetAssignmentsForClassOutput>>;
}
//# sourceMappingURL=GetAssignmentsForClassUseCase.d.ts.map