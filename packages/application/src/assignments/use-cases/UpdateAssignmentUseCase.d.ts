import { Result } from '@woodie/domain';
import { IAssignmentRepository } from '@woodie/domain';
import { UseCase } from '../../use-cases/UseCase';
export interface UpdateAssignmentInput {
    assignmentId: string;
    teacherId: string;
    title?: string;
    description?: string;
    dueDate?: Date;
    timezone?: string;
    maxAttempts?: number;
    unlimitedAttempts?: boolean;
}
export interface UpdateAssignmentOutput {
    assignmentId: string;
    title: string;
    description?: string;
    dueDate: Date;
    maxAttempts?: number;
    status: string;
    updatedAt: Date;
}
export declare class UpdateAssignmentUseCase implements UseCase<UpdateAssignmentInput, UpdateAssignmentOutput> {
    private assignmentRepository;
    constructor(assignmentRepository: IAssignmentRepository);
    execute(request: UpdateAssignmentInput): Promise<Result<UpdateAssignmentOutput>>;
}
//# sourceMappingURL=UpdateAssignmentUseCase.d.ts.map