import { UseCase } from '../../use-cases/UseCase';
import { Result, Problem, IProblemRepository, UniqueEntityID } from '@woodie/domain';
import { ProblemDto } from '../dto/ProblemDto';

export interface GetProblemRequest {
  problemId: string;
  requesterId?: string;
}

export class GetProblemUseCase implements UseCase<GetProblemRequest, ProblemDto> {
  constructor(
    private problemRepository: IProblemRepository
  ) {}

  async execute(request: GetProblemRequest): Promise<Result<ProblemDto>> {
    try {
      // 1. 입력 검증
      if (!request.problemId?.trim()) {
        return Result.fail<ProblemDto>('Problem ID is required');
      }

      // 2. 문제 조회
      const problemResult = await this.problemRepository.findById(new UniqueEntityID(request.problemId.trim()));
      if (problemResult.isFailure) {
        return Result.fail<ProblemDto>(`Failed to find problem: ${problemResult.errorValue}`);
      }

      if (!problemResult.value) {
        return Result.fail<ProblemDto>('Problem not found');
      }

      const problem = problemResult.value;

      // 3. 권한 검증 (비활성화된 문제는 소유자만 조회 가능)
      if (request.requesterId && !problem.isActive && !problem.isOwnedBy(request.requesterId)) {
        return Result.fail<ProblemDto>('Access denied: Inactive problem can only be accessed by owner');
      }

      // 4. 사용 전 검증 (활성화된 문제만)
      if (problem.isActive) {
        const validationResult = problem.validateForUse();
        if (validationResult.isFailure) {
          return Result.fail<ProblemDto>(`Problem validation failed: ${validationResult.errorValue}`);
        }
      }

      // 5. DTO로 변환하여 응답
      const problemDto = this.mapToDto(problem);
      return Result.ok<ProblemDto>(problemDto);

    } catch (error) {
      return Result.fail<ProblemDto>(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private mapToDto(problem: Problem): ProblemDto {
    return {
      id: problem.id.toString(),
      teacherId: problem.teacherId,
      title: problem.content.title,
      description: problem.content.description || '',
      type: problem.type.value,
      difficulty: problem.difficulty.level,
      tags: problem.tags.map(tag => tag.name),
      isActive: problem.isActive,
      createdAt: problem.createdAt.toISOString(),
      updatedAt: problem.updatedAt.toISOString()
    };
  }
}