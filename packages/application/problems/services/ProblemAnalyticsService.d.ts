import { IProblemRepository } from '@woodie/domain/problems/repositories/IProblemRepository';
import { Result } from '@woodie/domain/common/Result';
import { ILogger } from '../../common/interfaces/ILogger';
import { ICacheService } from '../../common/interfaces/ICacheService';
import { ProblemBankSummaryDto, TagAnalyticsDto, DifficultyStatsDto, ProblemTypeStatsDto } from '../dto/ProblemDto';
export declare class ProblemAnalyticsService {
    private problemRepository;
    private logger;
    private cacheService?;
    constructor(problemRepository: IProblemRepository, logger: ILogger, cacheService?: ICacheService | undefined);
    getProblemBankSummary(teacherId: string): Promise<Result<ProblemBankSummaryDto>>;
    getTagAnalytics(teacherId: string): Promise<Result<TagAnalyticsDto>>;
    getDifficultyAnalysis(teacherId: string): Promise<Result<DifficultyStatsDto[]>>;
    getTypeDistribution(teacherId: string): Promise<Result<ProblemTypeStatsDto[]>>;
    invalidateTeacherCache(teacherId: string): Promise<void>;
    private calculateAverageTagsPerProblem;
    private calculateRecentlyAddedTags;
    private ensureCompleteDifficultyRange;
    private generateCorrelationId;
}
//# sourceMappingURL=ProblemAnalyticsService.d.ts.map