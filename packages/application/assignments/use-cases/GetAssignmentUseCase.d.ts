import { Result } from '@woodie/domain';
import { IAssignmentRepository } from '@woodie/domain';
import { UseCase } from '../../use-cases/UseCase';
export interface GetAssignmentInput {
    assignmentId: string;
    requesterId: string;
}
export interface AssignmentDetailOutput {
    id: string;
    teacherId: string;
    problemSetId: string;
    title: string;
    description?: string;
    dueDate: Date;
    maxAttempts?: number;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    dueDateStatus: {
        isOverdue: boolean;
        isDueSoon: boolean;
        hoursUntilDue: number;
        daysUntilDue: number;
        statusMessage: string;
    };
    targets: {
        totalCount: number;
        activeCount: number;
        assignedClasses: string[];
        assignedStudents: string[];
    };
    permissions: {
        canEdit: boolean;
        canDelete: boolean;
        canActivate: boolean;
        canAssign: boolean;
    };
}
export declare class GetAssignmentUseCase implements UseCase<GetAssignmentInput, AssignmentDetailOutput> {
    private assignmentRepository;
    constructor(assignmentRepository: IAssignmentRepository);
    execute(request: GetAssignmentInput): Promise<Result<AssignmentDetailOutput>>;
}
//# sourceMappingURL=GetAssignmentUseCase.d.ts.map