import { Result } from '@woodie/domain';
import { AssignmentService } from '@woodie/domain';
import { UseCase } from '../../use-cases/UseCase';
export interface ExtendDueDateInput {
    assignmentId: string;
    additionalHours: number;
    teacherId: string;
    reason?: string;
}
export interface ExtendDueDateOutput {
    assignmentId: string;
    previousDueDate: Date;
    newDueDate: Date;
    extendedHours: number;
    message: string;
}
export declare class ExtendDueDateUseCase implements UseCase<ExtendDueDateInput, ExtendDueDateOutput> {
    private assignmentService;
    constructor(assignmentService: AssignmentService);
    execute(request: ExtendDueDateInput): Promise<Result<ExtendDueDateOutput>>;
}
//# sourceMappingURL=ExtendDueDateUseCase.d.ts.map