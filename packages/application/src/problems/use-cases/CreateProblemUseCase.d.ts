import { Result } from '@woodie/domain';
import { IProblemRepository } from '@woodie/domain';
import { UseCase } from '../../use-cases/UseCase';
import { ICreateProblemUseCase, CreateProblemInput, CreateProblemOutput } from '../interfaces/IProblemUseCases';
export declare class CreateProblemUseCase implements ICreateProblemUseCase, UseCase<CreateProblemInput, CreateProblemOutput> {
    private problemRepository;
    constructor(problemRepository: IProblemRepository);
    execute(request: CreateProblemInput): Promise<Result<CreateProblemOutput>>;
}
//# sourceMappingURL=CreateProblemUseCase.d.ts.map