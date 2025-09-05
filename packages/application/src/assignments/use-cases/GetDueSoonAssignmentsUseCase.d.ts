import { Result } from '@woodie/domain';
import { AssignmentService } from '@woodie/domain';
import { UseCase } from '../../use-cases/UseCase';
export interface GetDueSoonAssignmentsInput {
    hoursThreshold?: number;
    teacherId?: string;
    includeInactive?: boolean;
}
export interface DueSoonAssignmentSummary {
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
    assignmentInfo: {
        totalTargets: number;
        activeTargets: number;
        assignedClasses: string[];
        assignedStudents: string[];
    };
}
export interface GetDueSoonAssignmentsOutput {
    hoursThreshold: number;
    assignments: DueSoonAssignmentSummary[];
    summary: {
        totalDueSoonCount: number;
        criticalCount: number;
        highCount: number;
        mediumCount: number;
        activeCount: number;
        teacherCounts: Record<string, number>;
    };
}
export declare class GetDueSoonAssignmentsUseCase implements UseCase<GetDueSoonAssignmentsInput, GetDueSoonAssignmentsOutput> {
    private assignmentService;
    constructor(assignmentService: AssignmentService);
    execute(request: GetDueSoonAssignmentsInput): Promise<Result<GetDueSoonAssignmentsOutput>>;
}
//# sourceMappingURL=GetDueSoonAssignmentsUseCase.d.ts.map