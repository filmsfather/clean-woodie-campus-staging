import { Result } from '@woodie/domain';
import { 
  IAssignmentRepository,
  UniqueEntityID
} from '@woodie/domain';
import { UseCase } from '../../use-cases/UseCase';

export interface DeactivateAssignmentInput {
  assignmentId: string;
  teacherId: string;
}

export interface DeactivateAssignmentOutput {
  assignmentId: string;
  status: string;
  deactivatedAt: Date;
  message: string;
}

export class DeactivateAssignmentUseCase implements UseCase<DeactivateAssignmentInput, DeactivateAssignmentOutput> {
  constructor(
    private assignmentRepository: IAssignmentRepository
  ) {}

  async execute(request: DeactivateAssignmentInput): Promise<Result<DeactivateAssignmentOutput>> {
    try {
      // 1. 입력 검증
      if (!request.assignmentId?.trim()) {
        return Result.fail<DeactivateAssignmentOutput>('Assignment ID is required');
      }

      if (!request.teacherId?.trim()) {
        return Result.fail<DeactivateAssignmentOutput>('Teacher ID is required');
      }

      // 2. 과제 조회
      const assignmentId = new UniqueEntityID(request.assignmentId.trim());
      const assignmentResult = await this.assignmentRepository.findById(assignmentId);

      if (assignmentResult.isFailure) {
        return Result.fail<DeactivateAssignmentOutput>(`Assignment not found: ${assignmentResult.error}`);
      }

      const assignment = assignmentResult.value;

      // 3. 권한 검증
      if (!assignment.isOwnedBy(request.teacherId.trim())) {
        return Result.fail<DeactivateAssignmentOutput>('Only the assignment owner can deactivate assignments');
      }

      // 4. 비활성화
      assignment.deactivate();

      // 5. 저장
      const saveResult = await this.assignmentRepository.save(assignment);
      if (saveResult.isFailure) {
        return Result.fail<DeactivateAssignmentOutput>(`Failed to save assignment: ${saveResult.error}`);
      }

      // 6. Output DTO 생성
      const output: DeactivateAssignmentOutput = {
        assignmentId: request.assignmentId,
        status: assignment.status.valueOf(),
        deactivatedAt: new Date(),
        message: 'Assignment successfully deactivated'
      };

      return Result.ok<DeactivateAssignmentOutput>(output);

    } catch (error) {
      return Result.fail<DeactivateAssignmentOutput>(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }
}