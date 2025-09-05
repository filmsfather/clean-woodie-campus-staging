import { UseCase } from '../../use-cases/UseCase';
import { Result } from '@woodie/domain';
import { ProblemDto } from '../dto/ProblemDto';
import { IProblemSearchService } from '../interfaces/IProblemSearchService';
export interface SearchProblemsRequest {
    searchTerm?: string;
    tags?: string[];
    difficultyLevel?: number;
    difficultyRange?: {
        min: number;
        max: number;
    };
    teacherId?: string;
    isActive?: boolean;
    createdAfter?: Date;
    createdBefore?: Date;
    page?: number;
    limit?: number;
}
export interface SearchProblemsResponse {
    problems: ProblemDto[];
    totalCount: number;
    page: number;
    limit: number;
    hasNext: boolean;
    searchMetadata: {
        searchTerm?: string;
        appliedFilters: string[];
        searchDurationMs: number;
    };
}
export declare class SearchProblemsUseCase implements UseCase<SearchProblemsRequest, SearchProblemsResponse> {
    private problemSearchService;
    constructor(problemSearchService: IProblemSearchService);
    execute(request: SearchProblemsRequest): Promise<Result<SearchProblemsResponse>>;
    private getAppliedFilters;
    private mapToDto;
}
//# sourceMappingURL=SearchProblemsUseCase.d.ts.map