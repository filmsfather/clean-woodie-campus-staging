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
import * as crypto from 'crypto';

// 문제 검색 전용 서비스 (단일 책임 원칙)
export class ProblemSearchService {
  constructor(
    private problemRepository: IProblemRepository,
    private logger: ILogger,
    private cacheService?: ICacheService
  ) {}

  async searchProblems(
    filter: ProblemSearchRequestDto,
    pagination?: PaginationRequestDto,
    sort?: SortRequestDto
  ): Promise<Result<ProblemSearchResponseDto>> {
    const startTime = Date.now();
    const correlationId = this.generateCorrelationId();
    
    try {
      this.logger.info('Starting problem search', {
        filter,
        pagination,
        sort,
        correlationId
      });

      // 입력 검증
      const validationResult = this.validateSearchRequest(filter, pagination, sort);
      if (validationResult.isFailure) {
        return validationResult;
      }

      // 캐시 확인 (검색 결과 캐싱)
      const cacheKey = this.generateSearchCacheKey(filter, pagination, sort);
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
      const repositoryFilter = this.mapToRepositoryFilter(filter);
      const repositoryPagination = this.mapToRepositoryPagination(pagination);
      const repositorySort = this.mapToRepositorySort(sort);

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
        return Result.fail(error);
      }

      // Domain → DTO 변환
      const responseDto = this.mapToSearchResponseDto(searchResult.value);

      // 결과 캐싱
      if (this.cacheService && responseDto.problems.length > 0) {
        await this.cacheSearchResult(cacheKey, responseDto);
      }

      this.logger.info('Problem search completed successfully', {
        resultCount: responseDto.problems.length,
        hasNextPage: responseDto.metadata.hasNextPage,
        correlationId,
        duration: Date.now() - startTime
      });

      return Result.ok(responseDto);

    } catch (error) {
      const problemBankError = new ProblemBankError(
        ProblemBankErrorCode.SEARCH_FAILED,
        'Unexpected error during problem search',
        { filter, pagination, sort, correlationId },
        error as Error
      );

      this.logger.error('Problem search error', problemBankError.toLogObject(), {
        correlationId,
        duration: Date.now() - startTime
      });

      return Result.fail(problemBankError);
    }
  }

  async findProblemById(
    problemId: string,
    teacherId: string
  ): Promise<Result<ProblemDto>> {
    const correlationId = this.generateCorrelationId();
    
    try {
      this.logger.info('Finding problem by ID', {
        problemId,
        teacherId,
        correlationId
      });

      // 캐시 확인
      const cacheKey = CacheKeyBuilder.forProblem(problemId);
      if (this.cacheService) {
        const cached = await this.cacheService.get<ProblemDto>(cacheKey);
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
          teacherId,
          error: error.message,
          correlationId
        });

        return Result.fail(error);
      }

      const problem = problemResult.value;

      // 권한 확인
      if (!problem.isOwnedBy(teacherId)) {
        const error = ProblemBankErrorFactory.unauthorized(teacherId, problemId);
        this.logger.warn('Unauthorized problem access', {
          problemId,
          teacherId,
          correlationId
        });
        return Result.fail(error);
      }

      // Domain → DTO 변환
      const problemDto = this.mapProblemToDto(problem);

      // 결과 캐싱
      if (this.cacheService) {
        await this.cacheService.set(cacheKey, problemDto, CacheStrategies.getProblemOptions());
      }

      this.logger.info('Problem found successfully', {
        problemId,
        teacherId,
        correlationId
      });

      return Result.ok(problemDto);

    } catch (error) {
      const problemBankError = new ProblemBankError(
        ProblemBankErrorCode.PROBLEM_NOT_FOUND,
        'Unexpected error finding problem',
        { problemId, teacherId, correlationId },
        error as Error
      );

      this.logger.error('Find problem error', problemBankError.toLogObject(), {
        correlationId
      });

      return Result.fail(problemBankError);
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
        return Result.fail(ProblemBankErrorFactory.notFound(problemId));
      }

      const problem = problemResult.value;

      // 권한 확인
      if (!problem.isOwnedBy(teacherId)) {
        return Result.fail(ProblemBankErrorFactory.unauthorized(teacherId, problemId));
      }

      // 유사 문제 검색
      const similarResult = await this.problemRepository.findSimilarProblems(
        problem,
        teacherId,
        limit
      );

      if (similarResult.isFailure) {
        return Result.fail(ProblemBankErrorFactory.fromRepositoryError(similarResult.error));
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

      return Result.fail(problemBankError);
    }
  }

  // === Private 헬퍼 메서드들 ===

  private validateSearchRequest(
    filter: ProblemSearchRequestDto,
    pagination?: PaginationRequestDto,
    sort?: SortRequestDto
  ): Result<void> {
    // 페이지네이션 검증
    if (pagination) {
      if (pagination.limit <= 0 || pagination.limit > 100) {
        return Result.fail(new ProblemBankError(
          ProblemBankErrorCode.PAGINATION_ERROR,
          'Limit must be between 1 and 100'
        ));
      }

      if (pagination.strategy === 'offset' && pagination.page !== undefined && pagination.page < 1) {
        return Result.fail(new ProblemBankError(
          ProblemBankErrorCode.PAGINATION_ERROR,
          'Page number must be greater than 0'
        ));
      }
    }

    // 정렬 검증
    if (sort) {
      const validFields = ['createdAt', 'updatedAt', 'difficulty', 'title'];
      const validDirections = ['ASC', 'DESC'];

      if (!validFields.includes(sort.field)) {
        return Result.fail(new ProblemBankError(
          ProblemBankErrorCode.SORT_PARAMETER_INVALID,
          `Invalid sort field: ${sort.field}`
        ));
      }

      if (!validDirections.includes(sort.direction)) {
        return Result.fail(new ProblemBankError(
          ProblemBankErrorCode.SORT_PARAMETER_INVALID,
          `Invalid sort direction: ${sort.direction}`
        ));
      }
    }

    // 필터 검증
    if (filter.difficulties) {
      const invalidDifficulties = filter.difficulties.filter(d => d < 1 || d > 5);
      if (invalidDifficulties.length > 0) {
        return Result.fail(new ProblemBankError(
          ProblemBankErrorCode.INVALID_SEARCH_FILTER,
          `Invalid difficulty levels: ${invalidDifficulties.join(', ')}`
        ));
      }
    }

    return Result.ok();
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

  private generateSearchCacheKey(
    filter: ProblemSearchRequestDto,
    pagination?: PaginationRequestDto,
    sort?: SortRequestDto
  ): string {
    const searchParams = { filter, pagination, sort };
    const hash = crypto
      .createHash('md5')
      .update(JSON.stringify(searchParams))
      .digest('hex');
    return CacheKeyBuilder.forSearchResult(hash);
  }

  private async getCachedSearchResult(cacheKey: string): Promise<ProblemSearchResponseDto | null> {
    if (!this.cacheService) return null;

    try {
      return await this.cacheService.get<ProblemSearchResponseDto>(cacheKey);
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
    result: ProblemSearchResponseDto
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