import { Result } from '@woodie/domain';
import { AssignmentService } from '@woodie/domain';
import { UseCase } from '../../use-cases/UseCase';
export interface AssignToStudentInput {
    assignmentId: string;
    studentIds: string[];
    teacherId: string;
}
export interface AssignToStudentOutput {
    assignmentId: string;
    assignedStudentIds: string[];
    totalTargets: number;
    message: string;
}
export declare class AssignToStudentUseCase implements UseCase<AssignToStudentInput, AssignToStudentOutput> {
    private assignmentService;
    constructor(assignmentService: AssignmentService);
    execute(request: AssignToStudentInput): Promise<Result<AssignToStudentOutput>>;
}
//# sourceMappingURL=AssignToStudentUseCase.d.ts.map