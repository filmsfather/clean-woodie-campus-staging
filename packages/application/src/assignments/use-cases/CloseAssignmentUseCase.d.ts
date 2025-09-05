import { Result } from '@woodie/domain';
import { IAssignmentRepository } from '@woodie/domain';
import { UseCase } from '../../use-cases/UseCase';
export interface CloseAssignmentInput {
    assignmentId: string;
    teacherId: string;
}
export interface CloseAssignmentOutput {
    assignmentId: string;
    status: string;
    message: string;
    closedAt: Date;
}
export declare class CloseAssignmentUseCase implements UseCase<CloseAssignmentInput, CloseAssignmentOutput> {
    private assignmentRepository;
    constructor(assignmentRepository: IAssignmentRepository);
    execute(request: CloseAssignmentInput): Promise<Result<CloseAssignmentOutput>>;
}
//# sourceMappingURL=CloseAssignmentUseCase.d.ts.map