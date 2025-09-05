import { Result } from '@woodie/domain';
import { AssignmentService } from '@woodie/domain';
import { UseCase } from '../../use-cases/UseCase';
export interface AssignToClassInput {
    assignmentId: string;
    classIds: string[];
    teacherId: string;
}
export interface AssignToClassOutput {
    assignmentId: string;
    assignedClassIds: string[];
    totalTargets: number;
    message: string;
}
export declare class AssignToClassUseCase implements UseCase<AssignToClassInput, AssignToClassOutput> {
    private assignmentService;
    constructor(assignmentService: AssignmentService);
    execute(request: AssignToClassInput): Promise<Result<AssignToClassOutput>>;
}
//# sourceMappingURL=AssignToClassUseCase.d.ts.map