import { UseCase } from '../../use-cases/UseCase';
import { Result, IProblemRepository } from '@woodie/domain';
import { ProblemDto } from '../dto/ProblemDto';
export interface UpdateProblemContentRequest {
    problemId: string;
    teacherId: string;
    title: string;
    description?: string;
}
export declare class UpdateProblemContentUseCase implements UseCase<UpdateProblemContentRequest, ProblemDto> {
    private problemRepository;
    constructor(problemRepository: IProblemRepository);
    execute(request: UpdateProblemContentRequest): Promise<Result<ProblemDto>>;
    private mapToDto;
}
//# sourceMappingURL=UpdateProblemContentUseCase.d.ts.map