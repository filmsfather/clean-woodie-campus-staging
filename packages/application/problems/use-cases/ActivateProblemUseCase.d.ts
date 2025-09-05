import { UseCase } from '../../use-cases/UseCase';
import { Result, IProblemRepository } from '@woodie/domain';
import { ProblemDto } from '../dto/ProblemDto';
export interface ActivateProblemRequest {
    problemId: string;
    teacherId: string;
}
export declare class ActivateProblemUseCase implements UseCase<ActivateProblemRequest, ProblemDto> {
    private problemRepository;
    constructor(problemRepository: IProblemRepository);
    execute(request: ActivateProblemRequest): Promise<Result<ProblemDto>>;
    private mapToDto;
}
//# sourceMappingURL=ActivateProblemUseCase.d.ts.map