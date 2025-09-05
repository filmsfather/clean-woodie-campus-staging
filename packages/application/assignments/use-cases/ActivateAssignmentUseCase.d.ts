import { Result } from '@woodie/domain';
import { AssignmentService } from '@woodie/domain';
import { UseCase } from '../../use-cases/UseCase';
export interface ActivateAssignmentInput {
    assignmentId: string;
    teacherId: string;
}
export interface ActivateAssignmentOutput {
    assignmentId: string;
    status: string;
    activatedAt: Date;
    message: string;
}
export declare class ActivateAssignmentUseCase implements UseCase<ActivateAssignmentInput, ActivateAssignmentOutput> {
    private assignmentService;
    constructor(assignmentService: AssignmentService);
    execute(request: ActivateAssignmentInput): Promise<Result<ActivateAssignmentOutput>>;
}
//# sourceMappingURL=ActivateAssignmentUseCase.d.ts.map