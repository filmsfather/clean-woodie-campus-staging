import { Result } from '@woodie/domain';
import { AssignmentService, IAssignmentRepository } from '@woodie/domain';
import { UseCase } from '../../use-cases/UseCase';
export interface CreateAssignmentInput {
    teacherId: string;
    problemSetId: string;
    title: string;
    description?: string;
    dueDate: Date;
    timezone?: string;
    maxAttempts?: number;
    classIds?: string[];
    studentIds?: string[];
}
export interface CreateAssignmentOutput {
    assignmentId: string;
    title: string;
    status: string;
    dueDate: Date;
    hasTargets: boolean;
    targetCount: number;
}
export declare class CreateAssignmentUseCase implements UseCase<CreateAssignmentInput, CreateAssignmentOutput> {
    private assignmentRepository;
    private assignmentService;
    constructor(assignmentRepository: IAssignmentRepository, assignmentService: AssignmentService);
    execute(request: CreateAssignmentInput): Promise<Result<CreateAssignmentOutput>>;
}
//# sourceMappingURL=CreateAssignmentUseCase.d.ts.map