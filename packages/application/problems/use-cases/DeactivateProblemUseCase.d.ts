import { UseCase } from '../../use-cases/UseCase';
import { Result, IProblemRepository } from '@woodie/domain';
import { ProblemDto } from '../dto/ProblemDto';
export interface DeactivateProblemRequest {
    problemId: string;
    teacherId: string;
}
export declare class DeactivateProblemUseCase implements UseCase<DeactivateProblemRequest, ProblemDto> {
    private problemRepository;
    constructor(problemRepository: IProblemRepository);
    execute(request: DeactivateProblemRequest): Promise<Result<ProblemDto>>;
    private mapToDto;
}
//# sourceMappingURL=DeactivateProblemUseCase.d.ts.map