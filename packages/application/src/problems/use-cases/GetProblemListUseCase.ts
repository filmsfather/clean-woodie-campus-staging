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

export class GetProblemListUseCase implements UseCase<GetProblemListRequest, GetProblemListResponse> {
  constructor(
    private problemRepository: IProblemRepository,
    private problemSearchService: IProblemSearchService
  ) {}

  async execute(request: GetProblemListRequest): Promise<Result<GetProblemListResponse>> {
    try {
      // 기본값 설정
      const page = Math.max(1, request.page || 1);
      const limit = Math.min(100, Math.max(1, request.limit || 20));
      const offset = (page - 1) * limit;

      // 검색 조건이 있는 경우 검색 서비스 사용
      if (this.hasSearchCriteria(request)) {
        return await this.executeWithSearch(request, page, limit, offset);
      }

      // 일반 조회
      return await this.executeSimpleList(request, page, limit, offset);

    } catch (error) {
      return Result.fail<GetProblemListResponse>(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private hasSearchCriteria(request: GetProblemListRequest): boolean {
    return !!(request.searchTerm || request.tags?.length || request.difficultyLevel);
  }

  private async executeWithSearch(
    request: GetProblemListRequest, 
    page: number, 
    limit: number, 
    offset: number
  ): Promise<Result<GetProblemListResponse>> {
    
    const searchCriteria = {
      teacherId: request.teacherId,
      isActive: request.isActive,
      tags: request.tags,
      difficultyLevel: request.difficultyLevel,
      searchTerm: request.searchTerm,
      offset,
      limit
    };

    const searchResult = await this.problemSearchService.searchProblems(searchCriteria);
    if (searchResult.isFailure) {
      return Result.fail<GetProblemListResponse>(`Search failed: ${searchResult.errorValue}`);
    }

    const { problems, totalCount } = searchResult.value;
    
    return Result.ok<GetProblemListResponse>({
      problems: problems.map(p => this.mapToDto(p)),
      totalCount,
      page,
      limit,
      hasNext: offset + limit < totalCount
    });
  }

  private async executeSimpleList(
    request: GetProblemListRequest,
    page: number,
    limit: number,
    offset: number
  ): Promise<Result<GetProblemListResponse>> {

    // 조건 객체 생성
    const criteria: any = {};
    if (request.teacherId) criteria.teacherId = request.teacherId;
    if (request.isActive !== undefined) criteria.isActive = request.isActive;

    // 목록 조회
    const listResult = await this.problemRepository.findMany(criteria, { offset, limit });
    if (listResult.isFailure) {
      return Result.fail<GetProblemListResponse>(`Failed to fetch problems: ${listResult.errorValue}`);
    }

    // 총 개수 조회
    const countResult = await this.problemRepository.count(criteria);
    if (countResult.isFailure) {
      return Result.fail<GetProblemListResponse>(`Failed to count problems: ${countResult.errorValue}`);
    }

    const problems = listResult.value;
    const totalCount = countResult.value;

    return Result.ok<GetProblemListResponse>({
      problems: problems.map(p => this.mapToDto(p)),
      totalCount,
      page,
      limit,
      hasNext: offset + limit < totalCount
    });
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