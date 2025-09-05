import { UseCase } from '../../use-cases/UseCase';
import { Result, IProblemRepository, UniqueEntityID } from '@woodie/domain';
import { DeleteProblemInput } from '../interfaces/IProblemUseCases';

export interface DeleteProblemRequest {
  problemId: string;
  teacherId: string;
  hardDelete?: boolean; // true: 물리적 삭제, false: 논리적 삭제 (비활성화)
}

export interface DeleteProblemResponse {
  deleted: boolean;
  message: string;
}

export class DeleteProblemUseCase implements UseCase<DeleteProblemInput, void> {
  constructor(
    private problemRepository: IProblemRepository
  ) {}

  async execute(request: DeleteProblemInput): Promise<Result<void>> {
    try {
      // 1. 입력 검증
      if (!request.problemId?.trim()) {
        return Result.fail<void>('Problem ID is required');
      }

      if (!request.teacherId?.trim()) {
        return Result.fail<void>('Teacher ID is required');
      }

      // 2. 문제 조회
      const problemResult = await this.problemRepository.findById(new UniqueEntityID(request.problemId.trim()));
      if (problemResult.isFailure) {
        return Result.fail<void>(`Failed to find problem: ${problemResult.errorValue}`);
      }

      if (!problemResult.value) {
        return Result.fail<void>('Problem not found');
      }

      const problem = problemResult.value;

      // 3. 권한 검증 (소유자만 삭제 가능)
      if (!problem.isOwnedBy(request.teacherId)) {
        return Result.fail<void>('Access denied: Only problem owner can delete problem');
      }

      // 4. 삭제 방식에 따른 처리
      if (request.hardDelete === true) {
        // 물리적 삭제
        const deleteResult = await this.problemRepository.delete(problem.id);
        if (deleteResult.isFailure) {
          return Result.fail<void>(`Failed to delete problem: ${deleteResult.errorValue}`);
        }

        return Result.ok<void>(undefined);
      } else {
        // 논리적 삭제 (비활성화)
        const deactivateResult = problem.deactivate();
        if (deactivateResult.isFailure) {
          return Result.fail<void>(`Failed to deactivate problem: ${deactivateResult.errorValue}`);
        }

        const saveResult = await this.problemRepository.save(problem);
        if (saveResult.isFailure) {
          return Result.fail<void>(`Failed to save problem: ${saveResult.errorValue}`);
        }

        return Result.ok<void>(undefined);
      }

    } catch (error) {
      return Result.fail<void>(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}