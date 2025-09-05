import { Result } from '@woodie/domain';
import { IAssignmentRepository } from '@woodie/domain';
import { UseCase } from '../../use-cases/UseCase';
export interface DeactivateAssignmentInput {
    assignmentId: string;
    teacherId: string;
}
export interface DeactivateAssignmentOutput {
    assignmentId: string;
    status: string;
    deactivatedAt: Date;
    message: string;
}
export declare class DeactivateAssignmentUseCase implements UseCase<DeactivateAssignmentInput, DeactivateAssignmentOutput> {
    private assignmentRepository;
    constructor(assignmentRepository: IAssignmentRepository);
    execute(request: DeactivateAssignmentInput): Promise<Result<DeactivateAssignmentOutput>>;
}
//# sourceMappingURL=DeactivateAssignmentUseCase.d.ts.map