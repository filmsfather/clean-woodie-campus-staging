import { Result } from '@woodie/domain';
import { AssignmentService } from '@woodie/domain';
import { UseCase } from '../../use-cases/UseCase';
export interface GetOverdueAssignmentsInput {
    teacherId?: string;
    includeArchived?: boolean;
}
export interface OverdueAssignmentSummary {
    id: string;
    title: string;
    description?: string;
    dueDate: Date;
    maxAttempts?: number;
    status: string;
    teacherId: string;
    problemSetId: string;
    dueDateStatus: {
        isOverdue: boolean;
        isDueSoon: boolean;
        hoursUntilDue: number;
        daysUntilDue: number;
        statusMessage: string;
    };
    overdueInfo: {
        daysPastDue: number;
        hasBeenNotified: boolean;
        lastNotificationDate?: string;
    };
    assignmentInfo: {
        totalTargets: number;
        activeTargets: number;
        assignedClasses: string[];
        assignedStudents: string[];
    };
}
export interface GetOverdueAssignmentsOutput {
    assignments: OverdueAssignmentSummary[];
    summary: {
        totalOverdueCount: number;
        activeOverdueCount: number;
        teacherCounts: Record<string, number>;
    };
}
export declare class GetOverdueAssignmentsUseCase implements UseCase<GetOverdueAssignmentsInput, GetOverdueAssignmentsOutput> {
    private assignmentService;
    constructor(assignmentService: AssignmentService);
    execute(request: GetOverdueAssignmentsInput): Promise<Result<GetOverdueAssignmentsOutput>>;
}
//# sourceMappingURL=GetOverdueAssignmentsUseCase.d.ts.map