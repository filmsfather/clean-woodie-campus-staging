import { Result } from '@woodie/domain';
import { AssignmentService } from '@woodie/domain';
import { UseCase } from '../../use-cases/UseCase';
export interface ChangeDueDateInput {
    assignmentId: string;
    newDueDate: Date;
    timezone?: string;
    teacherId: string;
    reason?: string;
}
export interface ChangeDueDateOutput {
    assignmentId: string;
    previousDueDate: Date;
    newDueDate: Date;
    message: string;
}
export declare class ChangeDueDateUseCase implements UseCase<ChangeDueDateInput, ChangeDueDateOutput> {
    private assignmentService;
    constructor(assignmentService: AssignmentService);
    execute(request: ChangeDueDateInput): Promise<Result<ChangeDueDateOutput>>;
}
//# sourceMappingURL=ChangeDueDateUseCase.d.ts.map