import { Result } from '@woodie/domain';
import { 
  IAssignmentRepository,
  UniqueEntityID
} from '@woodie/domain';
import { UseCase } from '../../use-cases/UseCase';

export interface CloseAssignmentInput {
  assignmentId: string;
  teacherId: string;
}

export interface CloseAssignmentOutput {
  assignmentId: string;
  status: string;
  message: string;
  closedAt: Date;
}

export class CloseAssignmentUseCase implements UseCase<CloseAssignmentInput, CloseAssignmentOutput> {
  constructor(
    private assignmentRepository: IAssignmentRepository
  ) {}

  async execute(request: CloseAssignmentInput): Promise<Result<CloseAssignmentOutput>> {
    try {
      // 1. 입력 검증
      if (!request.assignmentId?.trim()) {
        return Result.fail<CloseAssignmentOutput>('Assignment ID is required');
      }

      if (!request.teacherId?.trim()) {
        return Result.fail<CloseAssignmentOutput>('Teacher ID is required');
      }

      // 2. 과제 조회
      const assignmentId = new UniqueEntityID(request.assignmentId.trim());
      const assignmentResult = await this.assignmentRepository.findById(assignmentId);

      if (assignmentResult.isFailure) {
        return Result.fail<CloseAssignmentOutput>(`Assignment not found: ${assignmentResult.error}`);
      }

      const assignment = assignmentResult.value;

      // 3. 권한 검증
      if (!assignment.isOwnedBy(request.teacherId.trim())) {
        return Result.fail<CloseAssignmentOutput>('Only the assignment owner can close assignments');
      }

      // 4. 마감 처리
      const closeResult = assignment.close();
      if (closeResult.isFailure) {
        return Result.fail<CloseAssignmentOutput>(closeResult.error);
      }

      // 5. 저장
      const saveResult = await this.assignmentRepository.save(assignment);
      if (saveResult.isFailure) {
        return Result.fail<CloseAssignmentOutput>(`Failed to save assignment: ${saveResult.error}`);
      }

      // 6. Output DTO 생성
      const output: CloseAssignmentOutput = {
        assignmentId: request.assignmentId,
        status: assignment.status,
        message: 'Assignment successfully closed',
        closedAt: assignment.updatedAt
      };

      return Result.ok<CloseAssignmentOutput>(output);

    } catch (error) {
      return Result.fail<CloseAssignmentOutput>(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }
}