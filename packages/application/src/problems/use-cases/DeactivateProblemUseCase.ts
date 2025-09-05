import { UseCase } from '../../use-cases/UseCase';
import { Result, Problem, IProblemRepository, UniqueEntityID } from '@woodie/domain';
import { ProblemDto } from '../dto/ProblemDto';

export interface DeactivateProblemRequest {
  problemId: string;
  teacherId: string;
}

export class DeactivateProblemUseCase implements UseCase<DeactivateProblemRequest, ProblemDto> {
  constructor(
    private problemRepository: IProblemRepository
  ) {}

  async execute(request: DeactivateProblemRequest): Promise<Result<ProblemDto>> {
    try {
      // 1. 입력 검증
      if (!request.problemId?.trim()) {
        return Result.fail<ProblemDto>('Problem ID is required');
      }

      if (!request.teacherId?.trim()) {
        return Result.fail<ProblemDto>('Teacher ID is required');
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

      // 3. 권한 검증 (소유자만 수정 가능)
      if (!problem.isOwnedBy(request.teacherId)) {
        return Result.fail<ProblemDto>('Access denied: Only problem owner can deactivate problem');
      }

      // 4. 도메인 로직 실행
      const deactivateResult = problem.deactivate();
      if (deactivateResult.isFailure) {
        return Result.fail<ProblemDto>(`Failed to deactivate problem: ${deactivateResult.errorValue}`);
      }

      // 5. 저장
      const saveResult = await this.problemRepository.save(problem);
      if (saveResult.isFailure) {
        return Result.fail<ProblemDto>(`Failed to save problem: ${saveResult.errorValue}`);
      }

      // 6. DTO로 변환하여 응답
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