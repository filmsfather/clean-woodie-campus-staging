import { Result } from '@woodie/domain';
import { 
  Problem, 
  ProblemContent, 
  AnswerContent, 
  Difficulty, 
  Tag,
  IProblemRepository
} from '@woodie/domain';
import { UseCase } from '../../use-cases/UseCase';
import { 
  ICreateProblemUseCase,
  CreateProblemInput,
  CreateProblemOutput 
} from '../interfaces/IProblemUseCases';
import { ProblemMapper } from '../mappers/ProblemMapper';
import { ProblemUseCaseErrorFactory } from '../errors/ProblemUseCaseErrors';

export class CreateProblemUseCase implements ICreateProblemUseCase, UseCase<CreateProblemInput, CreateProblemOutput> {
  constructor(
    private problemRepository: IProblemRepository
  ) {}

  async execute(request: CreateProblemInput): Promise<Result<CreateProblemOutput>> {
    try {
      // 1. 입력 검증 (도메인 오류 사용)
      if (!request.teacherId?.trim()) {
        return ProblemUseCaseErrorFactory.requiredFieldMissing<CreateProblemOutput>('teacherId');
      }

      if (!request.title?.trim()) {
        return ProblemUseCaseErrorFactory.requiredFieldMissing<CreateProblemOutput>('title');
      }

      if (!request.correctAnswerValue?.trim()) {
        return ProblemUseCaseErrorFactory.requiredFieldMissing<CreateProblemOutput>('correctAnswerValue');
      }

      // 2. Value Objects 생성
      const contentResult = ProblemContent.create({
        title: request.title.trim(),
        description: request.description?.trim(),
        type: request.type as any
      });

      if (contentResult.isFailure) {
        return Result.fail<CreateProblemOutput>(`Invalid problem content: ${contentResult.error}`);
      }

      const answerResult = AnswerContent.create({
        type: request.type as any,
        acceptedAnswers: [request.correctAnswerValue.trim()],
        points: 1
      });

      if (answerResult.isFailure) {
        return Result.fail<CreateProblemOutput>(`Invalid answer content: ${answerResult.error}`);
      }

      const difficultyResult = Difficulty.create(request.difficultyLevel);
      if (difficultyResult.isFailure) {
        return Result.fail<CreateProblemOutput>(`Invalid difficulty: ${difficultyResult.error}`);
      }

      // 3. 태그 처리
      const tags: Tag[] = [];
      if (request.tags && request.tags.length > 0) {
        for (const tagName of request.tags) {
          const tagResult = Tag.create(tagName.trim());
          if (tagResult.isFailure) {
            return Result.fail<CreateProblemOutput>(`Invalid tag '${tagName}': ${tagResult.error}`);
          }
          tags.push(tagResult.value);
        }
      }

      // 4. Problem 엔티티 생성
      const problemResult = Problem.create({
        teacherId: request.teacherId.trim(),
        content: contentResult.value,
        correctAnswer: answerResult.value,
        difficulty: difficultyResult.value,
        tags
      });

      if (problemResult.isFailure) {
        return Result.fail<CreateProblemOutput>(`Failed to create problem: ${problemResult.error}`);
      }

      const problem = problemResult.value;

      // 5. 저장 (도메인 오류 사용)
      const saveResult = await this.problemRepository.save(problem);
      if (saveResult.isFailure) {
        return ProblemUseCaseErrorFactory.repositoryError<CreateProblemOutput>(
          `Failed to save problem: ${saveResult.error}`
        );
      }

      // 6. 도메인 엔티티를 Output DTO로 변환하여 응답 (의존성 규칙 준수)
      return Result.ok<CreateProblemOutput>({
        problem: ProblemMapper.toOutput(problem)
      });

    } catch (error) {
      return ProblemUseCaseErrorFactory.unexpectedError<CreateProblemOutput>(
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }
}