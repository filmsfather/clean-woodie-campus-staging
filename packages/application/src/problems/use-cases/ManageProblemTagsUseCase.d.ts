import { UseCase } from '../../use-cases/UseCase';
import { Result, IProblemRepository } from '@woodie/domain';
import { ProblemDto } from '../dto/ProblemDto';
import { ManageProblemTagsInput } from '../interfaces/IProblemUseCases';
export interface ManageProblemTagsRequest {
    problemId: string;
    teacherId: string;
    operation: 'add' | 'remove' | 'update';
    tagNames: string[];
}
export declare class ManageProblemTagsUseCase implements UseCase<ManageProblemTagsInput, ProblemDto> {
    private problemRepository;
    constructor(problemRepository: IProblemRepository);
    execute(request: ManageProblemTagsInput): Promise<Result<ProblemDto>>;
    private addTags;
    private removeTags;
    private updateTags;
    private mapToDto;
}
//# sourceMappingURL=ManageProblemTagsUseCase.d.ts.map