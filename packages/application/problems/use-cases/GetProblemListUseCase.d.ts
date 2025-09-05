import { UseCase } from '../../use-cases/UseCase';
import { Result, IProblemRepository } from '@woodie/domain';
import { ProblemDto } from '../dto/ProblemDto';
import { IProblemSearchService } from '../interfaces/IProblemSearchService';
export interface GetProblemListRequest {
    teacherId?: string;
    isActive?: boolean;
    tags?: string[];
    difficultyLevel?: number;
    searchTerm?: string;
    page?: number;
    limit?: number;
}
export interface GetProblemListResponse {
    problems: ProblemDto[];
    totalCount: number;
    page: number;
    limit: number;
    hasNext: boolean;
}
export declare class GetProblemListUseCase implements UseCase<GetProblemListRequest, GetProblemListResponse> {
    private problemRepository;
    private problemSearchService;
    constructor(problemRepository: IProblemRepository, problemSearchService: IProblemSearchService);
    execute(request: GetProblemListRequest): Promise<Result<GetProblemListResponse>>;
    private hasSearchCriteria;
    private executeWithSearch;
    private executeSimpleList;
    private mapToDto;
}
//# sourceMappingURL=GetProblemListUseCase.d.ts.map