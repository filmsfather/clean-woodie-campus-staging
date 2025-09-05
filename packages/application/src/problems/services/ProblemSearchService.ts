import { IProblemRepository } from '@woodie/domain/problems/repositories/IProblemRepository';
import { Result } from '@woodie/domain/common/Result';
import { UniqueEntityID } from '@woodie/domain/common/Identifier';
import { Problem } from '@woodie/domain/problems/entities/Problem';
import { ILogger } from '../../common/interfaces/ILogger';
import { ICacheService, CacheKeyBuilder, CacheStrategies } from '../../common/interfaces/ICacheService';
import {
  ProblemDto,
  ProblemSearchRequestDto,
  PaginationRequestDto,
  SortRequestDto,
  ProblemSearchResponseDto
} from '../dto/ProblemDto';
import {
  ProblemBankError,
  ProblemBankErrorFactory,
  ProblemBankErrorCode
} from '../errors/ProblemBankErrors';
import { 
  IProblemSearchService, 
  ProblemSearchCriteria, 
  ProblemSearchResult 
} from '../interfaces/IProblemSearchService';
import * as crypto from 'crypto';

// 문제 검색 전용 서비스 (단일 책임 원칙)
// Clean Architecture Domain Service 구현
export class ProblemSearchService implements IProblemSearchService {
  constructor(
    private problemRepository: IProblemRepository,
    private logger: ILogger,
    private cacheService?: ICacheService
  ) {}

  async searchProblems(
    criteria: ProblemSearchCriteria
  ): Promise<Result<ProblemSearchResult>> {
    const startTime = Date.now();
    const correlationId = this.generateCorrelationId();
    
    try {
      this.logger.info('Starting problem search', {
        criteria,
        correlationId
      });

      // 캐시 확인 (검색 결과 캐싱)
      const cacheKey = this.generateSearchCacheKey(criteria);
      if (this.cacheService) {
        const cached = await this.getCachedSearchResult(cacheKey);
        if (cached) {
          this.logger.info('Search result served from cache', {
            cacheKey,
            correlationId,
            duration: Date.now() - startTime
          });
          return Result.ok(cached);
        }
      }

      // Repository 필터 변환
      const repositoryFilter = this.mapCriteriaToRepositoryFilter(criteria);
      const repositoryPagination = this.mapCriteriaToPagination(criteria);
      const repositorySort = this.mapCriteriaToSort(criteria);

      // Repository 호출
      const searchResult = await this.problemRepository.searchProblems(
        repositoryFilter,
        repositoryPagination,
        repositorySort
      );

      if (searchResult.isFailure) {
        const error = ProblemBankErrorFactory.fromRepositoryError(searchResult.error);
        this.logger.error('Problem search failed', error.toLogObject(), {
          correlationId,
          duration: Date.now() - startTime
        });
        return Result.fail(error.message);
      }

      // Domain 결과 매핑 (Repository 결과를 Domain 인터페이스에 맞게 변환)
      const result: ProblemSearchResult = {
        problems: searchResult.value.problems, // 이미 Domain Entity
        totalCount: searchResult.value.metadata.totalCount || 0
      };

      // 결과 캐싱
      if (this.cacheService && result.problems.length > 0) {
        await this.cacheSearchResult(cacheKey, result);
      }

      this.logger.info('Problem search completed successfully', {
        resultCount: result.problems.length,
        totalCount: result.totalCount,
        correlationId,
        duration: Date.now() - startTime
      });

      return Result.ok(result);

    } catch (error) {
      const problemBankError = new ProblemBankError(
        ProblemBankErrorCode.SEARCH_FAILED,
        'Unexpected error during problem search',
        { criteria, correlationId },
        error as Error
      );

      this.logger.error('Problem search error', problemBankError.toLogObject(), {
        correlationId,
        duration: Date.now() - startTime
      });

      return Result.fail(problemBankError.message);
    }
  }

  async findProblemById(
    problemId: string,
    requesterId?: string
  ): Promise<Result<Problem>> {
    const correlationId = this.generateCorrelationId();
    
    try {
      this.logger.info('Finding problem by ID', {
        problemId,
        requesterId,
        correlationId
      });

      // 캐시 확인 (Domain Entity 캐싱)
      const cacheKey = CacheKeyBuilder.forProblem(problemId);
      if (this.cacheService) {
        const cached = await this.cacheService.get<Problem>(cacheKey);
        if (cached) {
          this.logger.info('Problem served from cache', {
            problemId,
            cacheKey,
            correlationId
          });
          return Result.ok(cached);
        }
      }

      // Repository 호출
      const problemResult = await this.problemRepository.findById(
        new UniqueEntityID(problemId)
      );

      if (problemResult.isFailure) {
        const error = problemResult.error.includes('not found')
          ? ProblemBankErrorFactory.notFound(problemId)
          : ProblemBankErrorFactory.fromRepositoryError(problemResult.error);

        this.logger.warn('Problem not found or access failed', {
          problemId,
          requesterId,
          error: error.message,
          correlationId
        });

        return Result.fail(error.message);
      }

      const problem = problemResult.value;

      // 권한 확인 (DDD: Domain Entity의 비즈니스 로직 사용)
      if (requesterId && !problem.isOwnedBy(requesterId)) {
        const error = ProblemBankErrorFactory.unauthorized(requesterId, problemId);
        this.logger.warn('Unauthorized problem access', {
          problemId,
          requesterId,
          correlationId
        });
        return Result.fail(error.message);
      }

      // 결과 캐싱 (Domain Entity 직접 캐싱)
      if (this.cacheService) {
        await this.cacheService.set(cacheKey, problem, CacheStrategies.getProblemOptions());
      }

      this.logger.info('Problem found successfully', {
        problemId,
        requesterId,
        correlationId
      });

      return Result.ok(problem);

    } catch (error) {
      const problemBankError = new ProblemBankError(
        ProblemBankErrorCode.PROBLEM_NOT_FOUND,
        'Unexpected error finding problem',
        { problemId, requesterId, correlationId },
        error as Error
      );

      this.logger.error('Find problem error', problemBankError.toLogObject(), {
        correlationId
      });

      return Result.fail(problemBankError.message);
    }
  }

  async findProblemsByTeacher(
    teacherId: string,
    includeInactive?: boolean
  ): Promise<Result<Problem[]>> {
    const correlationId = this.generateCorrelationId();
    
    try {
      this.logger.info('Finding problems by teacher', {
        teacherId,
        includeInactive,
        correlationId
      });

      const repositoryFilter = {
        teacherId,
        isActive: includeInactive === true ? undefined : true
      };

      const searchResult = await this.problemRepository.searchProblems(
        repositoryFilter,
        undefined,
        undefined
      );

      if (searchResult.isFailure) {
        return Result.fail(ProblemBankErrorFactory.fromRepositoryError(searchResult.error).message);
      }

      this.logger.info('Problems found by teacher', {
        teacherId,
        count: searchResult.value.problems.length,
        correlationId
      });

      return Result.ok(searchResult.value.problems);

    } catch (error) {
      const problemBankError = new ProblemBankError(
        ProblemBankErrorCode.SEARCH_FAILED,
        'Failed to find problems by teacher',
        { teacherId, includeInactive, correlationId },
        error as Error
      );

      this.logger.error('Find problems by teacher error', problemBankError.toLogObject(), {
        correlationId
      });

      return Result.fail(problemBankError.message);
    }
  }

  async findProblemsByTags(
    tags: string[],
    teacherId?: string
  ): Promise<Result<Problem[]>> {
    const correlationId = this.generateCorrelationId();
    
    try {
      this.logger.info('Finding problems by tags', {
        tags,
        teacherId,
        correlationId
      });

      const repositoryFilter = {
        tagNames: tags,
        teacherId,
        isActive: true
      };

      const searchResult = await this.problemRepository.searchProblems(
        repositoryFilter,
        undefined,
        undefined
      );

      if (searchResult.isFailure) {
        return Result.fail(ProblemBankErrorFactory.fromRepositoryError(searchResult.error).message);
      }

      this.logger.info('Problems found by tags', {
        tags,
        count: searchResult.value.problems.length,
        correlationId
      });

      return Result.ok(searchResult.value.problems);

    } catch (error) {
      const problemBankError = new ProblemBankError(
        ProblemBankErrorCode.SEARCH_FAILED,
        'Failed to find problems by tags',
        { tags, teacherId, correlationId },
        error as Error
      );

      this.logger.error('Find problems by tags error', problemBankError.toLogObject(), {
        correlationId
      });

      return Result.fail(problemBankError.message);
    }
  }

  async findPopularProblems(
    limit: number = 10,
    teacherId?: string
  ): Promise<Result<Problem[]>> {
    const correlationId = this.generateCorrelationId();
    
    try {
      this.logger.info('Finding popular problems', {
        limit,
        teacherId,
        correlationId
      });

      const repositoryFilter = {
        teacherId,
        isActive: true
      };

      const repositoryPagination = {
        limit,
        page: 1,
        strategy: 'offset' as const
      };

      const repositorySort = {
        field: 'createdAt' as const,
        direction: 'DESC' as const
      };

      const searchResult = await this.problemRepository.searchProblems(
        repositoryFilter,
        repositoryPagination,
        repositorySort
      );

      if (searchResult.isFailure) {
        return Result.fail(ProblemBankErrorFactory.fromRepositoryError(searchResult.error).message);
      }

      this.logger.info('Popular problems found', {
        count: searchResult.value.problems.length,
        correlationId
      });

      return Result.ok(searchResult.value.problems);

    } catch (error) {
      const problemBankError = new ProblemBankError(
        ProblemBankErrorCode.SEARCH_FAILED,
        'Failed to find popular problems',
        { limit, teacherId, correlationId },
        error as Error
      );

      this.logger.error('Find popular problems error', problemBankError.toLogObject(), {
        correlationId
      });

      return Result.fail(problemBankError.message);
    }
  }

  async findSimilarProblems(
    problemId: string,
    teacherId: string,
    limit: number = 5
  ): Promise<Result<ProblemDto[]>> {
    const correlationId = this.generateCorrelationId();
    
    try {
      this.logger.info('Finding similar problems', {
        problemId,
        teacherId,
        limit,
        correlationId
      });

      // 원본 문제 조회
      const problemResult = await this.problemRepository.findById(
        new UniqueEntityID(problemId)
      );

      if (problemResult.isFailure) {
        return Result.fail(ProblemBankErrorFactory.notFound(problemId).message);
      }

      const problem = problemResult.value;

      // 권한 확인
      if (!problem.isOwnedBy(teacherId)) {
        return Result.fail(ProblemBankErrorFactory.unauthorized(teacherId, problemId).message);
      }

      // 유사 문제 검색
      const similarResult = await this.problemRepository.findSimilarProblems(
        problem,
        teacherId,
        limit
      );

      if (similarResult.isFailure) {
        return Result.fail(ProblemBankErrorFactory.fromRepositoryError(similarResult.error).message);
      }

      // Domain → DTO 변환
      const similarDtos = similarResult.value.map(p => this.mapProblemToDto(p));

      this.logger.info('Similar problems found', {
        problemId,
        similarCount: similarDtos.length,
        correlationId
      });

      return Result.ok(similarDtos);

    } catch (error) {
      const problemBankError = new ProblemBankError(
        ProblemBankErrorCode.SEARCH_FAILED,
        'Failed to find similar problems',
        { problemId, teacherId, limit, correlationId },
        error as Error
      );

      this.logger.error('Find similar problems error', problemBankError.toLogObject(), {
        correlationId
      });

      return Result.fail(problemBankError.message);
    }
  }

  // === Private 헬퍼 메서드들 ===

  private validateSearchCriteria(criteria: ProblemSearchCriteria): Result<void> {
    // 페이지네이션 검증
    if (criteria.limit && (criteria.limit <= 0 || criteria.limit > 100)) {
      const error = new ProblemBankError(
        ProblemBankErrorCode.PAGINATION_ERROR,
        'Limit must be between 1 and 100'
      );
      return Result.fail(error.message);
    }

    if (criteria.offset && criteria.offset < 0) {
      const error = new ProblemBankError(
        ProblemBankErrorCode.PAGINATION_ERROR,
        'Offset must be greater than or equal to 0'
      );
      return Result.fail(error.message);
    }

    // 난이도 검증
    if (criteria.difficultyLevel && (criteria.difficultyLevel < 1 || criteria.difficultyLevel > 5)) {
      const error = new ProblemBankError(
        ProblemBankErrorCode.INVALID_SEARCH_FILTER,
        'Difficulty level must be between 1 and 5'
      );
      return Result.fail(error.message);
    }

    if (criteria.difficultyRange) {
      const { min, max } = criteria.difficultyRange;
      if (min < 1 || max > 5 || min > max) {
        const error = new ProblemBankError(
          ProblemBankErrorCode.INVALID_SEARCH_FILTER,
          'Invalid difficulty range'
        );
        return Result.fail(error.message);
      }
    }

    return Result.ok();
  }

  private validateSearchRequest(
    filter: ProblemSearchRequestDto,
    pagination?: PaginationRequestDto,
    sort?: SortRequestDto
  ): Result<void> {
    // 페이지네이션 검증
    if (pagination) {
      if (pagination.limit <= 0 || pagination.limit > 100) {
        const error = new ProblemBankError(
          ProblemBankErrorCode.PAGINATION_ERROR,
          'Limit must be between 1 and 100'
        );
        return Result.fail(error.message);
      }

      if (pagination.strategy === 'offset' && pagination.page !== undefined && pagination.page < 1) {
        const error = new ProblemBankError(
          ProblemBankErrorCode.PAGINATION_ERROR,
          'Page number must be greater than 0'
        );
        return Result.fail(error.message);
      }
    }

    // 정렬 검증
    if (sort) {
      const validFields = ['createdAt', 'updatedAt', 'difficulty', 'title'];
      const validDirections = ['ASC', 'DESC'];

      if (!validFields.includes(sort.field)) {
        const error = new ProblemBankError(
          ProblemBankErrorCode.SORT_PARAMETER_INVALID,
          `Invalid sort field: ${sort.field}`
        );
        return Result.fail(error.message);
      }

      if (!validDirections.includes(sort.direction)) {
        const error = new ProblemBankError(
          ProblemBankErrorCode.SORT_PARAMETER_INVALID,
          `Invalid sort direction: ${sort.direction}`
        );
        return Result.fail(error.message);
      }
    }

    // 필터 검증
    if (filter.difficulties) {
      const invalidDifficulties = filter.difficulties.filter(d => d < 1 || d > 5);
      if (invalidDifficulties.length > 0) {
        const error = new ProblemBankError(
          ProblemBankErrorCode.INVALID_SEARCH_FILTER,
          `Invalid difficulty levels: ${invalidDifficulties.join(', ')}`
        );
        return Result.fail(error.message);
      }
    }

    return Result.ok();
  }

  private mapCriteriaToRepositoryFilter(criteria: ProblemSearchCriteria) {
    return {
      teacherId: criteria.teacherId,
      difficultyLevels: criteria.difficultyLevel ? [criteria.difficultyLevel] : 
                       criteria.difficultyRange ? Array.from(
                         { length: criteria.difficultyRange.max - criteria.difficultyRange.min + 1 },
                         (_, i) => criteria.difficultyRange!.min + i
                       ) : undefined,
      tagNames: criteria.tags,
      isActive: criteria.isActive,
      searchQuery: criteria.searchTerm,
      createdAfter: criteria.createdAfter ? new Date(criteria.createdAfter) : undefined,
      createdBefore: criteria.createdBefore ? new Date(criteria.createdBefore) : undefined
    };
  }

  private mapCriteriaToPagination(criteria: ProblemSearchCriteria) {
    if (!criteria.limit && !criteria.offset) return undefined;

    return {
      limit: criteria.limit || 20,
      page: criteria.offset ? Math.floor(criteria.offset / (criteria.limit || 20)) + 1 : 1,
      strategy: 'offset' as const
    };
  }

  private mapCriteriaToSort(criteria: ProblemSearchCriteria) {
    return {
      field: 'createdAt' as const,
      direction: 'DESC' as const
    };
  }

  private mapToRepositoryFilter(filter: ProblemSearchRequestDto) {
    return {
      teacherId: filter.teacherId,
      typeValues: filter.types,
      difficultyLevels: filter.difficulties,
      tagNames: filter.tags,
      isActive: filter.isActive,
      searchQuery: filter.searchQuery,
      createdAfter: filter.createdAfter ? new Date(filter.createdAfter) : undefined,
      createdBefore: filter.createdBefore ? new Date(filter.createdBefore) : undefined
    };
  }

  private mapToRepositoryPagination(pagination?: PaginationRequestDto) {
    if (!pagination) return undefined;

    return {
      limit: pagination.limit,
      page: pagination.page,
      strategy: pagination.strategy,
      cursor: pagination.cursor ? {
        field: pagination.cursor.field,
        value: pagination.cursor.field.includes('At') 
          ? new Date(pagination.cursor.value as string)
          : pagination.cursor.value,
        direction: pagination.cursor.direction
      } : undefined
    };
  }

  private mapToRepositorySort(sort?: SortRequestDto) {
    if (!sort) return undefined;

    return {
      field: sort.field as 'createdAt' | 'updatedAt' | 'difficulty' | 'title',
      direction: sort.direction
    };
  }

  private mapToSearchResponseDto(searchResult: any): ProblemSearchResponseDto {
    return {
      problems: searchResult.problems.map((p: Problem) => this.mapProblemToDto(p)),
      totalCount: searchResult.metadata.totalCount || 0,
      metadata: searchResult.metadata
    };
  }

  private mapProblemToDto(problem: Problem): ProblemDto {
    return {
      id: problem.id.toString(),
      teacherId: problem.teacherId,
      type: problem.type.value,
      title: problem.content.title,
      difficulty: problem.difficulty.level,
      tags: problem.tags.map(tag => tag.name),
      isActive: problem.isActive,
      createdAt: problem.createdAt.toISOString(),
      updatedAt: problem.updatedAt.toISOString()
    };
  }

  private generateSearchCacheKey(criteria: ProblemSearchCriteria): string {
    const hash = crypto
      .createHash('md5')
      .update(JSON.stringify(criteria))
      .digest('hex');
    return CacheKeyBuilder.forSearchResult(hash);
  }

  private async getCachedSearchResult(cacheKey: string): Promise<ProblemSearchResult | null> {
    if (!this.cacheService) return null;

    try {
      return await this.cacheService.get<ProblemSearchResult>(cacheKey);
    } catch (error) {
      this.logger.warn('Cache read failed', {
        cacheKey,
        error: (error as Error).message
      });
      return null;
    }
  }

  private async cacheSearchResult(
    cacheKey: string,
    result: ProblemSearchResult
  ): Promise<void> {
    if (!this.cacheService) return;

    try {
      await this.cacheService.set(cacheKey, result, CacheStrategies.getSearchOptions());
    } catch (error) {
      this.logger.warn('Cache write failed', {
        cacheKey,
        error: (error as Error).message
      });
    }
  }

  private generateCorrelationId(): string {
    return crypto.randomUUID();
  }
}