import { UseCase } from '../../use-cases/UseCase';
import { Result, Problem, AnswerContent, IProblemRepository, UniqueEntityID } from '@woodie/domain';
import { ProblemDto } from '../dto/ProblemDto';

export interface UpdateProblemAnswerRequest {
  problemId: string;
  teacherId: string;
  correctAnswerValue: string;
}

export class UpdateProblemAnswerUseCase implements UseCase<UpdateProblemAnswerRequest, ProblemDto> {
  constructor(
    private problemRepository: IProblemRepository
  ) {}

  async execute(request: UpdateProblemAnswerRequest): Promise<Result<ProblemDto>> {
    try {
      // 1. 입력 검증
      if (!request.problemId?.trim()) {
        return Result.fail<ProblemDto>('Problem ID is required');
      }

      if (!request.teacherId?.trim()) {
        return Result.fail<ProblemDto>('Teacher ID is required');
      }

      if (!request.correctAnswerValue?.trim()) {
        return Result.fail<ProblemDto>('Correct answer value is required');
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
        return Result.fail<ProblemDto>('Access denied: Only problem owner can update answer');
      }

      // 4. 새로운 답안 내용 생성
      const newAnswerResult = AnswerContent.create({
        type: problem.type.value as any,
        acceptedAnswers: [request.correctAnswerValue.trim()],
        points: 1
      });

      if (newAnswerResult.isFailure) {
        return Result.fail<ProblemDto>(`Invalid answer: ${newAnswerResult.errorValue}`);
      }

      // 5. 도메인 로직 실행
      const updateResult = problem.updateCorrectAnswer(newAnswerResult.value);
      if (updateResult.isFailure) {
        return Result.fail<ProblemDto>(`Failed to update answer: ${updateResult.errorValue}`);
      }

      // 6. 저장
      const saveResult = await this.problemRepository.save(problem);
      if (saveResult.isFailure) {
        return Result.fail<ProblemDto>(`Failed to save problem: ${saveResult.errorValue}`);
      }

      // 7. DTO로 변환하여 응답
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