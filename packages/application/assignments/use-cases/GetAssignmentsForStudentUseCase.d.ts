import { Result } from '@woodie/domain';
import { AssignmentService } from '@woodie/domain';
import { UseCase } from '../../use-cases/UseCase';
export interface GetAssignmentsForStudentInput {
    studentId: string;
    includeCompleted?: boolean;
    includePastDue?: boolean;
}
export interface StudentAssignmentSummary {
    id: string;
    title: string;
    description?: string;
    dueDate: Date;
    maxAttempts?: number;
    status: string;
    problemSetId: string;
    teacherId: string;
    dueDateStatus: {
        isOverdue: boolean;
        isDueSoon: boolean;
        hoursUntilDue: number;
        daysUntilDue: number;
    };
    accessibility: {
        isAccessible: boolean;
        canSubmit: boolean;
    };
}
export interface GetAssignmentsForStudentOutput {
    studentId: string;
    assignments: StudentAssignmentSummary[];
    summary: {
        totalCount: number;
        activeCount: number;
        overdueCount: number;
        dueSoonCount: number;
    };
}
export declare class GetAssignmentsForStudentUseCase implements UseCase<GetAssignmentsForStudentInput, GetAssignmentsForStudentOutput> {
    private assignmentService;
    constructor(assignmentService: AssignmentService);
    execute(request: GetAssignmentsForStudentInput): Promise<Result<GetAssignmentsForStudentOutput>>;
}
//# sourceMappingURL=GetAssignmentsForStudentUseCase.d.ts.map