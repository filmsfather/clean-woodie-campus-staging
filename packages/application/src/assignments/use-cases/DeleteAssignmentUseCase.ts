import { Result } from '@woodie/domain';
import { 
  IAssignmentRepository,
  UniqueEntityID
} from '@woodie/domain';
import { UseCase } from '../../use-cases/UseCase';

export interface DeleteAssignmentInput {
  assignmentId: string;
  teacherId: string; // 권한 검증용
}

export interface DeleteAssignmentOutput {
  assignmentId: string;
  success: boolean;
  message: string;
}

export class DeleteAssignmentUseCase implements UseCase<DeleteAssignmentInput, DeleteAssignmentOutput> {
  constructor(
    private assignmentRepository: IAssignmentRepository
  ) {}

  async execute(request: DeleteAssignmentInput): Promise<Result<DeleteAssignmentOutput>> {
    try {
      // 1. 입력 검증
      if (!request.assignmentId?.trim()) {
        return Result.fail<DeleteAssignmentOutput>('Assignment ID is required');
      }

      if (!request.teacherId?.trim()) {
        return Result.fail<DeleteAssignmentOutput>('Teacher ID is required');
      }

      // 2. 과제 조회
      const assignmentId = new UniqueEntityID(request.assignmentId.trim());
      const assignmentResult = await this.assignmentRepository.findById(assignmentId);

      if (assignmentResult.isFailure) {
        return Result.fail<DeleteAssignmentOutput>(`Assignment not found: ${assignmentResult.error}`);
      }

      const assignment = assignmentResult.value;

      // 3. 권한 검증
      if (!assignment.isOwnedBy(request.teacherId.trim())) {
        return Result.fail<DeleteAssignmentOutput>('Only the assignment owner can delete assignments');
      }

      // 4. 비즈니스 규칙 검증 - 활성 과제는 보관 후 삭제
      if (assignment.isActive()) {
        assignment.archive();
        
        const saveResult = await this.assignmentRepository.save(assignment);
        if (saveResult.isFailure) {
          return Result.fail<DeleteAssignmentOutput>(`Failed to archive assignment: ${saveResult.error}`);
        }
      }

      // 5. 삭제 처리
      const deleteResult = await this.assignmentRepository.delete(assignmentId);
      if (deleteResult.isFailure) {
        return Result.fail<DeleteAssignmentOutput>(`Failed to delete assignment: ${deleteResult.error}`);
      }

      // 6. Output DTO 생성
      const output: DeleteAssignmentOutput = {
        assignmentId: request.assignmentId,
        success: true,
        message: 'Assignment successfully deleted'
      };

      return Result.ok<DeleteAssignmentOutput>(output);

    } catch (error) {
      return Result.fail<DeleteAssignmentOutput>(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }
}