import { UseCase } from '../../use-cases/UseCase';
import { Result, IProblemRepository } from '@woodie/domain';
import { ProblemDto } from '../dto/ProblemDto';
export interface UpdateProblemAnswerRequest {
    problemId: string;
    teacherId: string;
    correctAnswerValue: string;
}
export declare class UpdateProblemAnswerUseCase implements UseCase<UpdateProblemAnswerRequest, ProblemDto> {
    private problemRepository;
    constructor(problemRepository: IProblemRepository);
    execute(request: UpdateProblemAnswerRequest): Promise<Result<ProblemDto>>;
    private mapToDto;
}
//# sourceMappingURL=UpdateProblemAnswerUseCase.d.ts.map