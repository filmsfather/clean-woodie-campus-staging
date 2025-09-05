import { IProblemRepository } from '@woodie/domain/problems/repositories/IProblemRepository';
import { Result } from '@woodie/domain/common/Result';
import { Problem } from '@woodie/domain/problems/entities/Problem';
import { ILogger } from '../../common/interfaces/ILogger';
import { ICacheService } from '../../common/interfaces/ICacheService';
import { ProblemDto } from '../dto/ProblemDto';
import { IProblemSearchService, ProblemSearchCriteria, ProblemSearchResult } from '../interfaces/IProblemSearchService';
export declare class ProblemSearchService implements IProblemSearchService {
    private problemRepository;
    private logger;
    private cacheService?;
    constructor(problemRepository: IProblemRepository, logger: ILogger, cacheService?: ICacheService | undefined);
    searchProblems(criteria: ProblemSearchCriteria): Promise<Result<ProblemSearchResult>>;
    findProblemById(problemId: string, requesterId?: string): Promise<Result<Problem>>;
    findProblemsByTeacher(teacherId: string, includeInactive?: boolean): Promise<Result<Problem[]>>;
    findProblemsByTags(tags: string[], teacherId?: string): Promise<Result<Problem[]>>;
    findPopularProblems(limit?: number, teacherId?: string): Promise<Result<Problem[]>>;
    findSimilarProblems(problemId: string, teacherId: string, limit?: number): Promise<Result<ProblemDto[]>>;
    private validateSearchCriteria;
    private validateSearchRequest;
    private mapCriteriaToRepositoryFilter;
    private mapCriteriaToPagination;
    private mapCriteriaToSort;
    private mapToRepositoryFilter;
    private mapToRepositoryPagination;
    private mapToRepositorySort;
    private mapToSearchResponseDto;
    private mapProblemToDto;
    private generateSearchCacheKey;
    private getCachedSearchResult;
    private cacheSearchResult;
    private generateCorrelationId;
}
//# sourceMappingURL=ProblemSearchService.d.ts.map