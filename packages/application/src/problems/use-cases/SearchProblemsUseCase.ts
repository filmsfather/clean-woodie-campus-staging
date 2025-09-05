import { UseCase } from '../../use-cases/UseCase';
import { Result } from '@woodie/domain';
import { ProblemDto } from '../dto/ProblemDto';
import { IProblemSearchService } from '../interfaces/IProblemSearchService';

export interface SearchProblemsRequest {
  searchTerm?: string;
  tags?: string[];
  difficultyLevel?: number;
  difficultyRange?: { min: number; max: number };
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

export class SearchProblemsUseCase implements UseCase<SearchProblemsRequest, SearchProblemsResponse> {
  constructor(
    private problemSearchService: IProblemSearchService
  ) {}

  async execute(request: SearchProblemsRequest): Promise<Result<SearchProblemsResponse>> {
    try {
      const startTime = Date.now();

      // 1. 입력 검증 및 기본값 설정
      const page = Math.max(1, request.page || 1);
      const limit = Math.min(100, Math.max(1, request.limit || 20));
      const offset = (page - 1) * limit;

      // 2. 검색 조건 구성
      const searchCriteria = {
        searchTerm: request.searchTerm?.trim(),
        tags: request.tags?.filter(tag => tag?.trim()).map(tag => tag.trim()),
        difficultyLevel: request.difficultyLevel,
        difficultyRange: request.difficultyRange,
        teacherId: request.teacherId?.trim(),
        isActive: request.isActive,
        createdAfter: request.createdAfter?.toISOString(),
        createdBefore: request.createdBefore?.toISOString(),
        offset,
        limit
      };

      // 3. 검색 실행
      const searchResult = await this.problemSearchService.searchProblems(searchCriteria);
      if (searchResult.isFailure) {
        return Result.fail<SearchProblemsResponse>(`Search failed: ${searchResult.errorValue}`);
      }

      const { problems, totalCount } = searchResult.value;
      const searchDurationMs = Date.now() - startTime;

      // 4. 적용된 필터 메타데이터 생성
      const appliedFilters = this.getAppliedFilters(request);

      // 5. 응답 구성
      const response: SearchProblemsResponse = {
        problems: problems.map(p => this.mapToDto(p)),
        totalCount,
        page,
        limit,
        hasNext: offset + limit < totalCount,
        searchMetadata: {
          searchTerm: request.searchTerm,
          appliedFilters,
          searchDurationMs
        }
      };

      return Result.ok<SearchProblemsResponse>(response);

    } catch (error) {
      return Result.fail<SearchProblemsResponse>(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private getAppliedFilters(request: SearchProblemsRequest): string[] {
    const filters: string[] = [];

    if (request.searchTerm?.trim()) filters.push('searchTerm');
    if (request.tags?.length) filters.push('tags');
    if (request.difficultyLevel !== undefined) filters.push('difficultyLevel');
    if (request.difficultyRange) filters.push('difficultyRange');
    if (request.teacherId?.trim()) filters.push('teacherId');
    if (request.isActive !== undefined) filters.push('isActive');
    if (request.createdAfter) filters.push('createdAfter');
    if (request.createdBefore) filters.push('createdBefore');

    return filters;
  }

  private mapToDto(problem: any): ProblemDto {
    return {
      id: problem.id.toString(),
      teacherId: problem.teacherId,
      title: problem.content.title,
      description: problem.content.description || '',
      type: problem.type.value,
      difficulty: problem.difficulty.level,
      tags: problem.tags.map((tag: any) => tag.name),
      isActive: problem.isActive,
      createdAt: problem.createdAt.toISOString(),
      updatedAt: problem.updatedAt.toISOString()
    };
  }
}