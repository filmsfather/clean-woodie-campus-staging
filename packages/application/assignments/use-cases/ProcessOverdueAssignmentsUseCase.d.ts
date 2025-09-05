import { Result } from '@woodie/domain';
import { AssignmentService } from '@woodie/domain';
import { UseCase } from '../../use-cases/UseCase';
export interface ProcessOverdueAssignmentsInput {
    dryRun?: boolean;
    teacherId?: string;
}
export interface ProcessedAssignmentSummary {
    id: string;
    title: string;
    teacherId: string;
    previousStatus: string;
    newStatus: string;
    dueDate: Date;
    hoursPastDue: number;
    daysPastDue: number;
    totalTargets: number;
    processedAt: Date;
}
export interface ProcessOverdueAssignmentsOutput {
    dryRun: boolean;
    processedCount: number;
    skippedCount: number;
    errorCount: number;
    processedAssignments: ProcessedAssignmentSummary[];
    errors: Array<{
        assignmentId: string;
        title: string;
        error: string;
    }>;
    summary: {
        totalOverdueFound: number;
        activeOverdueClosed: number;
        alreadyClosedSkipped: number;
        teacherProcessCounts: Record<string, number>;
    };
    executionTime: number;
}
export declare class ProcessOverdueAssignmentsUseCase implements UseCase<ProcessOverdueAssignmentsInput, ProcessOverdueAssignmentsOutput> {
    private assignmentService;
    constructor(assignmentService: AssignmentService);
    execute(request: ProcessOverdueAssignmentsInput): Promise<Result<ProcessOverdueAssignmentsOutput>>;
}
//# sourceMappingURL=ProcessOverdueAssignmentsUseCase.d.ts.map