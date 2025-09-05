import { IProblemRepository } from '@woodie/domain/problems/repositories/IProblemRepository';
import { ITagManagementService } from '@woodie/domain/problems/services/ITagManagementService';
import { Result } from '@woodie/domain/common/Result';
import { ILogger } from '../../common/interfaces/ILogger';
import { ICacheService } from '../../common/interfaces/ICacheService';
import { TagUsageDto, TagRecommendationDto, TagDistributionDto } from '../dto/ProblemDto';
export declare class TagRecommendationService {
    private problemRepository;
    private tagManagementService;
    private logger;
    private cacheService?;
    constructor(problemRepository: IProblemRepository, tagManagementService: ITagManagementService, logger: ILogger, cacheService?: ICacheService | undefined);
    getRecommendedTags(problemTitle: string, problemDescription: string, teacherId: string, maxRecommendations?: number): Promise<Result<TagRecommendationDto>>;
    findSimilarTags(inputTag: string, teacherId: string, maxSuggestions?: number): Promise<Result<string[]>>;
    analyzeTagUsage(teacherId: string, includeInactive?: boolean): Promise<Result<TagUsageDto[]>>;
    getTagDistribution(teacherId: string, tagFilter?: string[]): Promise<Result<TagDistributionDto[]>>;
    validateTagSet(tags: string[], teacherId: string): Promise<Result<{
        validTags: string[];
        invalidTags: string[];
        suggestions: string[];
    }>>;
    private generateContentHash;
    private calculateRecommendationConfidence;
    private determineRecommendationBasis;
    private generateRecommendationExplanation;
    private generateCorrelationId;
}
//# sourceMappingURL=TagRecommendationService.d.ts.map