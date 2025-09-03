import { IProblemRepository } from '@woodie/domain/problems/repositories/IProblemRepository';
import { Result } from '@woodie/domain/common/Result';
import { ILogger } from '../../common/interfaces/ILogger';
import { ICacheService, CacheKeyBuilder, CacheStrategies, CacheTags } from '../../common/interfaces/ICacheService';
import {
  ProblemBankSummaryDto,
  TagAnalyticsDto,
  DifficultyStatsDto,
  ProblemTypeStatsDto,
  TagUsageDto,
  RecentActivityDto,
  TagDistributionDto
} from '../dto/ProblemDto';
import {
  ProblemBankError,
  ProblemBankErrorFactory,
  ProblemBankErrorCode
} from '../errors/ProblemBankErrors';
import * as crypto from 'crypto';

// 문제 분석 및 통계 전용 서비스
export class ProblemAnalyticsService {
  constructor(
    private problemRepository: IProblemRepository,
    private logger: ILogger,
    private cacheService?: ICacheService
  ) {}

  async getProblemBankSummary(teacherId: string): Promise<Result<ProblemBankSummaryDto>> {
    const startTime = Date.now();
    const correlationId = this.generateCorrelationId();
    
    try {
      this.logger.info('Getting problem bank summary', {
        teacherId,
        correlationId
      });

      // 캐시 확인
      const cacheKey = CacheKeyBuilder.forTeacherStatistics(teacherId);
      if (this.cacheService) {
        const cached = await this.cacheService.get<ProblemBankSummaryDto>(cacheKey);
        if (cached) {
          this.logger.info('Problem bank summary served from cache', {
            teacherId,
            cacheKey,
            correlationId,
            duration: Date.now() - startTime
          });
          return Result.ok(cached);
        }
      }

      // Repository에서 통계 조회
      const statisticsResult = await this.problemRepository.getTeacherStatistics(teacherId);
      
      if (statisticsResult.isFailure) {
        const error = ProblemBankErrorFactory.fromRepositoryError(statisticsResult.error);
        this.logger.error('Failed to get teacher statistics', { ...error.toLogObject(), teacherId }, {
          correlationId,
          duration: Date.now() - startTime
        });
        return Result.fail(error.message);
      }

      const stats = statisticsResult.value;

      // DTO 변환
      const summaryDto: ProblemBankSummaryDto = {
        teacherId,
        totalProblems: stats.totalProblems,
        activeProblems: stats.activeProblems,
        inactiveProblems: stats.inactiveProblems,
        problemsByType: stats.problemsByType.map(item => ({
          type: item.type,
          count: item.count,
          percentage: stats.totalProblems > 0 ? (item.count / stats.totalProblems) * 100 : 0
        })),
        problemsByDifficulty: stats.problemsByDifficulty,
        averageTagsPerProblem: stats.averageTagsPerProblem,
        mostUsedTags: stats.mostUsedTags.map(item => ({
          tag: item.tag,
          count: item.count,
          percentage: stats.totalProblems > 0 ? (item.count / stats.totalProblems) * 100 : 0
        })),
        recentActivity: stats.recentActivity
      };

      // 결과 캐싱
      if (this.cacheService && stats.totalProblems > 0) {
        await this.cacheService.set(
          cacheKey, 
          summaryDto, 
          {
            ...CacheStrategies.getStatisticsOptions(),
            tags: [CacheTags.forTeacher(teacherId), CacheTags.STATISTICS]
          }
        );
      }

      this.logger.info('Problem bank summary generated successfully', {
        teacherId,
        totalProblems: summaryDto.totalProblems,
        correlationId,
        duration: Date.now() - startTime
      });

      return Result.ok(summaryDto);

    } catch (error) {
      const problemBankError = new ProblemBankError(
        ProblemBankErrorCode.STATISTICS_CALCULATION_FAILED,
        'Failed to calculate problem bank summary',
        { teacherId, correlationId },
        error as Error
      );

      this.logger.error('Problem bank summary error', problemBankError.toLogObject(), {
        correlationId,
        duration: Date.now() - startTime
      });

      return Result.fail(problemBankError.message);
    }
  }

  async getTagAnalytics(teacherId: string): Promise<Result<TagAnalyticsDto>> {
    const startTime = Date.now();
    const correlationId = this.generateCorrelationId();
    
    try {
      this.logger.info('Getting tag analytics', {
        teacherId,
        correlationId
      });

      // 캐시 확인
      const cacheKey = CacheKeyBuilder.forTagAnalytics(teacherId);
      if (this.cacheService) {
        const cached = await this.cacheService.get<TagAnalyticsDto>(cacheKey);
        if (cached) {
          this.logger.info('Tag analytics served from cache', {
            teacherId,
            cacheKey,
            correlationId,
            duration: Date.now() - startTime
          });
          return Result.ok(cached);
        }
      }

      // 최적화된 집계 쿼리들을 병렬로 실행
      const [tagStatsResult, uniqueTagsResult, tagDistributionResult] = await Promise.all([
        this.problemRepository.getTeacherTagStatistics(teacherId),
        this.problemRepository.getTeacherUniqueTags(teacherId),
        this.problemRepository.groupProblemsByTag(teacherId)
      ]);

      // 결과 검증
      if (tagStatsResult.isFailure) {
        return Result.fail(ProblemBankErrorFactory.tagAnalysisFailed(teacherId, new Error(tagStatsResult.error)).message);
      }

      if (uniqueTagsResult.isFailure) {
        return Result.fail(ProblemBankErrorFactory.tagAnalysisFailed(teacherId, new Error(uniqueTagsResult.error)).message);
      }

      if (tagDistributionResult.isFailure) {
        return Result.fail(ProblemBankErrorFactory.tagAnalysisFailed(teacherId, new Error(tagDistributionResult.error)).message);
      }

      const tagStats = tagStatsResult.value;
      const uniqueTags = uniqueTagsResult.value;
      const tagDistribution = tagDistributionResult.value;

      // 최근 추가된 태그 분석 (분포에서 계산)
      const recentlyAddedTags = this.calculateRecentlyAddedTags(tagDistribution);

      // DTO 구성
      const analyticsDto: TagAnalyticsDto = {
        totalUniqueTags: uniqueTags.length,
        averageTagsPerProblem: this.calculateAverageTagsPerProblem(tagStats),
        distribution: tagDistribution.map(group => ({
          tagName: group.tagName,
          problemIds: group.problems.map(p => p.id.toString()),
          count: group.count
        })),
        mostUsedTags: tagStats.slice(0, 10).map(stat => ({
          tag: stat.tag,
          count: stat.count,
          percentage: stat.percentage
        })),
        recentlyAddedTags
      };

      // 결과 캐싱
      if (this.cacheService && uniqueTags.length > 0) {
        await this.cacheService.set(
          cacheKey, 
          analyticsDto, 
          {
            ...CacheStrategies.getStatisticsOptions(),
            tags: [CacheTags.forTeacher(teacherId), CacheTags.ANALYTICS]
          }
        );
      }

      this.logger.info('Tag analytics generated successfully', {
        teacherId,
        totalUniqueTags: analyticsDto.totalUniqueTags,
        distributionCount: analyticsDto.distribution.length,
        correlationId,
        duration: Date.now() - startTime
      });

      return Result.ok(analyticsDto);

    } catch (error) {
      const problemBankError = new ProblemBankError(
        ProblemBankErrorCode.TAG_ANALYSIS_FAILED,
        'Failed to analyze tags',
        { teacherId, correlationId },
        error as Error
      );

      this.logger.error('Tag analytics error', problemBankError.toLogObject(), {
        correlationId,
        duration: Date.now() - startTime
      });

      return Result.fail(problemBankError.message);
    }
  }

  async getDifficultyAnalysis(teacherId: string): Promise<Result<DifficultyStatsDto[]>> {
    const startTime = Date.now();
    const correlationId = this.generateCorrelationId();
    
    try {
      this.logger.info('Getting difficulty analysis', {
        teacherId,
        correlationId
      });

      // 캐시 확인
      const cacheKey = CacheKeyBuilder.forDifficultyAnalysis(teacherId);
      if (this.cacheService) {
        const cached = await this.cacheService.get<DifficultyStatsDto[]>(cacheKey);
        if (cached) {
          this.logger.info('Difficulty analysis served from cache', {
            teacherId,
            cacheKey,
            correlationId,
            duration: Date.now() - startTime
          });
          return Result.ok(cached);
        }
      }

      // Repository에서 난이도 분포 조회
      const distributionResult = await this.problemRepository.getDifficultyDistribution(teacherId);
      
      if (distributionResult.isFailure) {
        const error = new ProblemBankError(
          ProblemBankErrorCode.DIFFICULTY_ANALYSIS_FAILED,
          'Failed to get difficulty distribution',
          { teacherId, correlationId },
          new Error(distributionResult.error)
        );
        return Result.fail(error.message);
      }

      const distribution = distributionResult.value;

      // 모든 난이도 레벨(1-5)에 대해 데이터 보장
      const completeDistribution = this.ensureCompleteDifficultyRange(distribution);

      // 결과 캐싱
      if (this.cacheService) {
        await this.cacheService.set(
          cacheKey, 
          completeDistribution, 
          {
            ...CacheStrategies.getStatisticsOptions(),
            tags: [CacheTags.forTeacher(teacherId), CacheTags.ANALYTICS]
          }
        );
      }

      this.logger.info('Difficulty analysis completed successfully', {
        teacherId,
        distributionSize: completeDistribution.length,
        correlationId,
        duration: Date.now() - startTime
      });

      return Result.ok(completeDistribution);

    } catch (error) {
      const problemBankError = new ProblemBankError(
        ProblemBankErrorCode.DIFFICULTY_ANALYSIS_FAILED,
        'Failed to analyze difficulty distribution',
        { teacherId, correlationId },
        error as Error
      );

      this.logger.error('Difficulty analysis error', problemBankError.toLogObject(), {
        correlationId,
        duration: Date.now() - startTime
      });

      return Result.fail(problemBankError.message);
    }
  }

  async getTypeDistribution(teacherId: string): Promise<Result<ProblemTypeStatsDto[]>> {
    const startTime = Date.now();
    const correlationId = this.generateCorrelationId();
    
    try {
      this.logger.info('Getting type distribution', {
        teacherId,
        correlationId
      });

      // Repository에서 타입 분포 조회
      const distributionResult = await this.problemRepository.getTeacherTypeDistribution(teacherId);
      
      if (distributionResult.isFailure) {
        return Result.fail(ProblemBankErrorFactory.fromRepositoryError(distributionResult.error).message);
      }

      const typeStats = distributionResult.value.map(stat => ({
        type: stat.type,
        count: stat.count,
        percentage: stat.percentage
      }));

      this.logger.info('Type distribution completed successfully', {
        teacherId,
        typeCount: typeStats.length,
        correlationId,
        duration: Date.now() - startTime
      });

      return Result.ok(typeStats);

    } catch (error) {
      const problemBankError = new ProblemBankError(
        ProblemBankErrorCode.STATISTICS_CALCULATION_FAILED,
        'Failed to get type distribution',
        { teacherId, correlationId },
        error as Error
      );

      this.logger.error('Type distribution error', problemBankError.toLogObject(), {
        correlationId,
        duration: Date.now() - startTime
      });

      return Result.fail(problemBankError.message);
    }
  }

  async invalidateTeacherCache(teacherId: string): Promise<void> {
    if (!this.cacheService) return;

    try {
      const keys = [
        CacheKeyBuilder.forTeacherStatistics(teacherId),
        CacheKeyBuilder.forTagAnalytics(teacherId),
        CacheKeyBuilder.forDifficultyAnalysis(teacherId)
      ];

      await this.cacheService.mdelete(keys);
      
      // 태그 기반 무효화
      await this.cacheService.invalidateByTags([
        CacheTags.forTeacher(teacherId),
        CacheTags.STATISTICS,
        CacheTags.ANALYTICS
      ]);

      this.logger.info('Teacher analytics cache invalidated', {
        teacherId,
        invalidatedKeys: keys.length
      });

    } catch (error) {
      this.logger.warn('Failed to invalidate teacher cache', {
        teacherId,
        error: (error as Error).message
      });
    }
  }

  // === Private 헬퍼 메서드들 ===

  private calculateAverageTagsPerProblem(tagStats: Array<{ tag: string; count: number; percentage: number }>): number {
    if (tagStats.length === 0) return 0;
    
    const totalTagUsage = tagStats.reduce((sum, stat) => sum + stat.count, 0);
    const uniqueProblems = new Set<number>(); // 실제로는 문제별 태그 수를 계산해야 함
    
    // 간단한 근사치 계산 (실제로는 Repository에서 정확한 값을 제공받아야 함)
    return totalTagUsage / Math.max(tagStats.length, 1);
  }

  private calculateRecentlyAddedTags(
    tagDistribution: Array<{ tagName: string; problems: any[]; count: number }>
  ): Array<{ tag: string; addedAt: string; problemCount: number }> {
    // 실제 구현에서는 태그별 최초 생성일을 추적해야 함
    // 여기서는 간단한 근사치로 구현
    const recentThreshold = new Date();
    recentThreshold.setDate(recentThreshold.getDate() - 7); // 최근 7일

    return tagDistribution
      .slice(0, 5) // 최근 5개만
      .map(distribution => ({
        tag: distribution.tagName,
        addedAt: new Date().toISOString(), // 실제로는 DB에서 조회
        problemCount: distribution.count
      }));
  }

  private ensureCompleteDifficultyRange(
    distribution: Array<{ difficulty: number; count: number; percentage: number }>
  ): DifficultyStatsDto[] {
    const result: DifficultyStatsDto[] = [];
    const distributionMap = new Map(distribution.map(d => [d.difficulty, d]));

    for (let difficulty = 1; difficulty <= 5; difficulty++) {
      const existing = distributionMap.get(difficulty);
      result.push({
        difficulty,
        count: existing?.count || 0,
        percentage: existing?.percentage || 0
      });
    }

    return result;
  }

  private generateCorrelationId(): string {
    return crypto.randomUUID();
  }
}