import { UseCase } from '../../use-cases/UseCase';
import { Result, IProblemRepository } from '@woodie/domain';
import { ProblemDto } from '../dto/ProblemDto';
import { ChangeProblemDifficultyInput } from '../interfaces/IProblemUseCases';
export interface ChangeProblemDifficultyRequest {
    problemId: string;
    teacherId: string;
    difficultyLevel: number;
}
export declare class ChangeProblemDifficultyUseCase implements UseCase<ChangeProblemDifficultyInput, ProblemDto> {
    private problemRepository;
    constructor(problemRepository: IProblemRepository);
    execute(request: ChangeProblemDifficultyInput): Promise<Result<ProblemDto>>;
    private mapToDto;
}
//# sourceMappingURL=ChangeProblemDifficultyUseCase.d.ts.map