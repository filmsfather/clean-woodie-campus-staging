import { UseCase } from '../../use-cases/UseCase';
import { Result, IProblemRepository } from '@woodie/domain';
import { DeleteProblemInput } from '../interfaces/IProblemUseCases';
export interface DeleteProblemRequest {
    problemId: string;
    teacherId: string;
    hardDelete?: boolean;
}
export interface DeleteProblemResponse {
    deleted: boolean;
    message: string;
}
export declare class DeleteProblemUseCase implements UseCase<DeleteProblemInput, void> {
    private problemRepository;
    constructor(problemRepository: IProblemRepository);
    execute(request: DeleteProblemInput): Promise<Result<void>>;
}
//# sourceMappingURL=DeleteProblemUseCase.d.ts.map