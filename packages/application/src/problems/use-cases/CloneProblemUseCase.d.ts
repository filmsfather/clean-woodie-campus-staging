import { UseCase } from '../../use-cases/UseCase';
import { Result, IProblemRepository } from '@woodie/domain';
import { ProblemDto } from '../dto/ProblemDto';
import { CloneProblemInput, CloneProblemOutput } from '../interfaces/IProblemUseCases';
export interface CloneProblemRequest {
    sourceProblemId: string;
    newTeacherId: string;
    requesterId: string;
}
export interface CloneProblemResponse {
    originalProblem: ProblemDto;
    clonedProblem: ProblemDto;
}
export declare class CloneProblemUseCase implements UseCase<CloneProblemInput, CloneProblemOutput> {
    private problemRepository;
    constructor(problemRepository: IProblemRepository);
    execute(request: CloneProblemInput): Promise<Result<CloneProblemOutput>>;
    private mapToDto;
}
//# sourceMappingURL=CloneProblemUseCase.d.ts.map