import { Result } from '@woodie/domain';
import { IAssignmentRepository } from '@woodie/domain';
import { UseCase } from '../../use-cases/UseCase';
export interface ArchiveAssignmentInput {
    assignmentId: string;
    teacherId: string;
}
export interface ArchiveAssignmentOutput {
    assignmentId: string;
    status: string;
    message: string;
    archivedAt: Date;
}
export declare class ArchiveAssignmentUseCase implements UseCase<ArchiveAssignmentInput, ArchiveAssignmentOutput> {
    private assignmentRepository;
    constructor(assignmentRepository: IAssignmentRepository);
    execute(request: ArchiveAssignmentInput): Promise<Result<ArchiveAssignmentOutput>>;
}
//# sourceMappingURL=ArchiveAssignmentUseCase.d.ts.map