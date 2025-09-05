import { UseCase } from '../../use-cases/UseCase';
import { Result, IProblemRepository } from '@woodie/domain';
import { ProblemDto } from '../dto/ProblemDto';
export interface GetProblemRequest {
    problemId: string;
    requesterId?: string;
}
export declare class GetProblemUseCase implements UseCase<GetProblemRequest, ProblemDto> {
    private problemRepository;
    constructor(problemRepository: IProblemRepository);
    execute(request: GetProblemRequest): Promise<Result<ProblemDto>>;
    private mapToDto;
}
//# sourceMappingURL=GetProblemUseCase.d.ts.map