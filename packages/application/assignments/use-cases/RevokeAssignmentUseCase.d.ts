import { Result } from '@woodie/domain';
import { AssignmentService } from '@woodie/domain';
import { UseCase } from '../../use-cases/UseCase';
export interface RevokeAssignmentInput {
    assignmentId: string;
    classIds?: string[];
    studentIds?: string[];
    teacherId: string;
}
export interface RevokeAssignmentOutput {
    assignmentId: string;
    revokedClassIds?: string[];
    revokedStudentIds?: string[];
    remainingTargets: number;
    message: string;
}
export declare class RevokeAssignmentUseCase implements UseCase<RevokeAssignmentInput, RevokeAssignmentOutput> {
    private assignmentService;
    constructor(assignmentService: AssignmentService);
    execute(request: RevokeAssignmentInput): Promise<Result<RevokeAssignmentOutput>>;
}
//# sourceMappingURL=RevokeAssignmentUseCase.d.ts.map