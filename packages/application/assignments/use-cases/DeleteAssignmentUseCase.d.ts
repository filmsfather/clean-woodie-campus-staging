import { Result } from '@woodie/domain';
import { IAssignmentRepository } from '@woodie/domain';
import { UseCase } from '../../use-cases/UseCase';
export interface DeleteAssignmentInput {
    assignmentId: string;
    teacherId: string;
}
export interface DeleteAssignmentOutput {
    assignmentId: string;
    success: boolean;
    message: string;
}
export declare class DeleteAssignmentUseCase implements UseCase<DeleteAssignmentInput, DeleteAssignmentOutput> {
    private assignmentRepository;
    constructor(assignmentRepository: IAssignmentRepository);
    execute(request: DeleteAssignmentInput): Promise<Result<DeleteAssignmentOutput>>;
}
//# sourceMappingURL=DeleteAssignmentUseCase.d.ts.map