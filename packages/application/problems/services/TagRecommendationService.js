import { Result } from '@woodie/domain/common/Result';
import { Tag } from '@woodie/domain/problems/value-objects/Tag';
import { CacheKeyBuilder, CacheStrategies } from '../../common/interfaces/ICacheService';
import { ProblemBankError, ProblemBankErrorFactory, ProblemBankErrorCode } from '../errors/ProblemBankErrors';
import * as crypto from 'crypto';
// 태그 추천 및 관리 전용 서비스
export class TagRecommendationService {
    problemRepository;
    tagManagementService;
    logger;
    cacheService;
    constructor(problemRepository, tagManagementService, logger, cacheService) {
        this.problemRepository = problemRepository;
        this.tagManagementService = tagManagementService;
        this.logger = logger;
        this.cacheService = cacheService;
    }
    async getRecommendedTags(problemTitle, problemDescription, teacherId, maxRecommendations = 5) {
        const startTime = Date.now();
        const correlationId = this.generateCorrelationId();
        try {
            this.logger.info('Getting tag recommendations', {
                titleLength: problemTitle.length,
                descriptionLength: problemDescription.length,
                teacherId,
                maxRecommendations,
                correlationId
            });
            // 입력 검증
            if (!problemTitle.trim() && !problemDescription.trim()) {
                const error = new ProblemBankError(ProblemBankErrorCode.RECOMMENDATION_FAILED, 'Problem title or description is required for tag recommendation');
                return Result.fail(error.message);
            }
            // 캐시 확인
            const contentHash = this.generateContentHash(problemTitle, problemDescription);
            const cacheKey = CacheKeyBuilder.forTagRecommendation(contentHash);
            if (this.cacheService) {
                const cached = await this.cacheService.get(cacheKey);
                if (cached) {
                    this.logger.info('Tag recommendations served from cache', {
                        contentHash,
                        cacheKey,
                        correlationId,
                        duration: Date.now() - startTime
                    });
                    return Result.ok(cached);
                }
            }
            // 교사의 기존 태그 조회 (최적화된 쿼리 사용)
            const existingTagsResult = await this.problemRepository.getTeacherUniqueTags(teacherId);
            if (existingTagsResult.isFailure) {
                return Result.fail(ProblemBankErrorFactory.fromRepositoryError(existingTagsResult.error).message);
            }
            const existingTagNames = existingTagsResult.value;
            const existingTags = existingTagNames
                .map(name => Tag.create(name))
                .filter(result => result.isSuccess)
                .map(result => result.value);
            // 도메인 서비스를 통한 태그 추천
            const recommendationResult = await this.tagManagementService.recommendTags(problemTitle, problemDescription, existingTags, { maxRecommendations });
            if (recommendationResult.isFailure) {
                const problemBankError = ProblemBankErrorFactory.domainServiceError('TagManagementService', 'recommendTags', new Error(recommendationResult.error));
                return Result.fail(problemBankError.message);
            }
            const recommendedTags = recommendationResult.value;
            // 추천 신뢰도 계산
            const confidence = this.calculateRecommendationConfidence(recommendedTags, existingTags, problemTitle, problemDescription);
            // 추천 기반 분류
            const basedOn = this.determineRecommendationBasis(problemTitle, problemDescription, recommendedTags, existingTags);
            // 설명 생성
            const explanation = this.generateRecommendationExplanation(recommendedTags, basedOn, confidence);
            // 결과 DTO 구성
            const recommendationDto = {
                recommendedTags: recommendedTags.map(tag => tag.name),
                confidence,
                basedOn,
                explanation
            };
            // 결과 캐싱
            if (this.cacheService && recommendedTags.length > 0) {
                await this.cacheService.set(cacheKey, recommendationDto, CacheStrategies.getRecommendationOptions());
            }
            this.logger.info('Tag recommendations generated successfully', {
                recommendedCount: recommendedTags.length,
                confidence,
                basedOn,
                teacherId,
                correlationId,
                duration: Date.now() - startTime
            });
            return Result.ok(recommendationDto);
        }
        catch (error) {
            const problemBankError = new ProblemBankError(ProblemBankErrorCode.RECOMMENDATION_FAILED, 'Failed to generate tag recommendations', { teacherId, correlationId }, error);
            this.logger.error('Tag recommendation error', problemBankError.toLogObject(), {
                correlationId,
                duration: Date.now() - startTime
            });
            return Result.fail(problemBankError.message);
        }
    }
    async findSimilarTags(inputTag, teacherId, maxSuggestions = 5) {
        const startTime = Date.now();
        const correlationId = this.generateCorrelationId();
        try {
            this.logger.info('Finding similar tags', {
                inputTag,
                teacherId,
                maxSuggestions,
                correlationId
            });
            // 입력 검증
            if (!inputTag.trim()) {
                const error = new ProblemBankError(ProblemBankErrorCode.TAG_MANAGEMENT_ERROR, 'Input tag cannot be empty');
                return Result.fail(error.message);
            }
            // 교사의 기존 태그 조회
            const existingTagsResult = await this.problemRepository.getTeacherUniqueTags(teacherId);
            if (existingTagsResult.isFailure) {
                return Result.fail(ProblemBankErrorFactory.fromRepositoryError(existingTagsResult.error).message);
            }
            const existingTagNames = existingTagsResult.value;
            const existingTags = existingTagNames
                .map(name => Tag.create(name))
                .filter(result => result.isSuccess)
                .map(result => result.value);
            // 도메인 서비스를 통한 유사 태그 검색
            const similarTagsResult = await this.tagManagementService.findSimilarTags(inputTag, existingTags, { maxSuggestions, similarityThreshold: 0.6 });
            if (similarTagsResult.isFailure) {
                const problemBankError = ProblemBankErrorFactory.domainServiceError('TagManagementService', 'findSimilarTags', new Error(similarTagsResult.error));
                return Result.fail(problemBankError.message);
            }
            const similarTags = similarTagsResult.value;
            const similarTagNames = similarTags.map(tag => tag.name);
            this.logger.info('Similar tags found successfully', {
                inputTag,
                similarCount: similarTagNames.length,
                teacherId,
                correlationId,
                duration: Date.now() - startTime
            });
            return Result.ok(similarTagNames);
        }
        catch (error) {
            const problemBankError = new ProblemBankError(ProblemBankErrorCode.TAG_MANAGEMENT_ERROR, 'Failed to find similar tags', { inputTag, teacherId, correlationId }, error);
            this.logger.error('Similar tags search error', problemBankError.toLogObject(), {
                correlationId,
                duration: Date.now() - startTime
            });
            return Result.fail(problemBankError.message);
        }
    }
    async analyzeTagUsage(teacherId, includeInactive = false) {
        const startTime = Date.now();
        const correlationId = this.generateCorrelationId();
        try {
            this.logger.info('Analyzing tag usage', {
                teacherId,
                includeInactive,
                correlationId
            });
            // 최적화된 집계 쿼리 사용
            const tagStatsResult = await this.problemRepository.getTeacherTagStatistics(teacherId);
            if (tagStatsResult.isFailure) {
                const problemBankError = ProblemBankErrorFactory.tagAnalysisFailed(teacherId, new Error(tagStatsResult.error));
                return Result.fail(problemBankError.message);
            }
            const tagStats = tagStatsResult.value;
            // DTO 변환
            const usageData = tagStats.map(stat => ({
                tag: stat.tag,
                count: stat.count,
                percentage: stat.percentage
            }));
            this.logger.info('Tag usage analysis completed successfully', {
                teacherId,
                tagCount: usageData.length,
                totalUsage: usageData.reduce((sum, item) => sum + item.count, 0),
                correlationId,
                duration: Date.now() - startTime
            });
            return Result.ok(usageData);
        }
        catch (error) {
            const problemBankError = new ProblemBankError(ProblemBankErrorCode.TAG_ANALYSIS_FAILED, 'Failed to analyze tag usage', { teacherId, includeInactive, correlationId }, error);
            this.logger.error('Tag usage analysis error', problemBankError.toLogObject(), {
                correlationId,
                duration: Date.now() - startTime
            });
            return Result.fail(problemBankError.message);
        }
    }
    async getTagDistribution(teacherId, tagFilter) {
        const startTime = Date.now();
        const correlationId = this.generateCorrelationId();
        try {
            this.logger.info('Getting tag distribution', {
                teacherId,
                tagFilter: tagFilter?.length || 0,
                correlationId
            });
            // Repository에서 태그별 그룹화된 데이터 조회
            const distributionResult = await this.problemRepository.groupProblemsByTag(teacherId, tagFilter);
            if (distributionResult.isFailure) {
                return Result.fail(ProblemBankErrorFactory.fromRepositoryError(distributionResult.error).message);
            }
            const distribution = distributionResult.value;
            // DTO 변환
            const distributionData = distribution.map(group => ({
                tagName: group.tagName,
                problemIds: group.problems.map(p => p.id.toString()),
                count: group.count
            }));
            this.logger.info('Tag distribution retrieved successfully', {
                teacherId,
                distributionSize: distributionData.length,
                totalProblems: distributionData.reduce((sum, item) => sum + item.count, 0),
                correlationId,
                duration: Date.now() - startTime
            });
            return Result.ok(distributionData);
        }
        catch (error) {
            const problemBankError = new ProblemBankError(ProblemBankErrorCode.TAG_ANALYSIS_FAILED, 'Failed to get tag distribution', { teacherId, tagFilter, correlationId }, error);
            this.logger.error('Tag distribution error', problemBankError.toLogObject(), {
                correlationId,
                duration: Date.now() - startTime
            });
            return Result.fail(problemBankError.message);
        }
    }
    async validateTagSet(tags, teacherId) {
        const correlationId = this.generateCorrelationId();
        try {
            this.logger.info('Validating tag set', {
                tagCount: tags.length,
                teacherId,
                correlationId
            });
            const validTags = [];
            const invalidTags = [];
            const suggestions = [];
            // 각 태그 검증
            for (const tagName of tags) {
                const tagResult = Tag.create(tagName);
                if (tagResult.isSuccess) {
                    validTags.push(tagName);
                }
                else {
                    invalidTags.push(tagName);
                    // 유사한 태그 제안
                    if (tagName.length > 2) {
                        const similarResult = await this.findSimilarTags(tagName, teacherId, 1);
                        if (similarResult.isSuccess && similarResult.value.length > 0) {
                            suggestions.push(similarResult.value[0]);
                        }
                    }
                }
            }
            const result = {
                validTags,
                invalidTags,
                suggestions: [...new Set(suggestions)] // 중복 제거
            };
            this.logger.info('Tag set validation completed', {
                ...result,
                teacherId,
                correlationId
            });
            return Result.ok(result);
        }
        catch (error) {
            const problemBankError = new ProblemBankError(ProblemBankErrorCode.TAG_MANAGEMENT_ERROR, 'Failed to validate tag set', { tags, teacherId, correlationId }, error);
            this.logger.error('Tag validation error', problemBankError.toLogObject(), {
                correlationId
            });
            return Result.fail(problemBankError.message);
        }
    }
    // === Private 헬퍼 메서드들 ===
    generateContentHash(title, description) {
        const content = `${title}|${description}`.toLowerCase().trim();
        return crypto.createHash('md5').update(content).digest('hex');
    }
    calculateRecommendationConfidence(recommendedTags, existingTags, title, description) {
        // 기본 신뢰도 계산 로직
        let confidence = 0.5; // 기본값
        // 기존 태그와의 유사성 보너스
        if (existingTags.length > 0) {
            const existingTagNames = new Set(existingTags.map(t => t.name.toLowerCase()));
            const matches = recommendedTags.filter(tag => existingTagNames.has(tag.name.toLowerCase())).length;
            confidence += (matches / recommendedTags.length) * 0.3;
        }
        // 텍스트 길이 보너스 (더 많은 정보 = 더 높은 신뢰도)
        const textLength = title.length + description.length;
        if (textLength > 100)
            confidence += 0.1;
        if (textLength > 500)
            confidence += 0.1;
        // 추천 태그 수에 따른 조정
        if (recommendedTags.length >= 3)
            confidence += 0.1;
        return Math.min(confidence, 1.0);
    }
    determineRecommendationBasis(title, description, recommendedTags, existingTags) {
        // 간단한 분류 로직
        const hasContent = title.trim().length > 0 || description.trim().length > 0;
        const hasExistingTags = existingTags.length > 0;
        if (hasContent && recommendedTags.length > 0) {
            return 'content';
        }
        else if (hasExistingTags) {
            return 'similarity';
        }
        else {
            return 'usage_pattern';
        }
    }
    generateRecommendationExplanation(recommendedTags, basedOn, confidence) {
        const explanations = {
            content: `문제 내용을 분석하여 ${recommendedTags.length}개의 태그를 추천했습니다.`,
            similarity: `기존 태그와의 유사성을 기반으로 ${recommendedTags.length}개의 태그를 추천했습니다.`,
            usage_pattern: `일반적인 사용 패턴을 기반으로 ${recommendedTags.length}개의 태그를 추천했습니다.`
        };
        let explanation = explanations[basedOn];
        if (confidence > 0.8) {
            explanation += ' (높은 신뢰도)';
        }
        else if (confidence > 0.6) {
            explanation += ' (보통 신뢰도)';
        }
        else {
            explanation += ' (낮은 신뢰도)';
        }
        return explanation;
    }
    generateCorrelationId() {
        return crypto.randomUUID();
    }
}
//# sourceMappingURL=TagRecommendationService.js.map