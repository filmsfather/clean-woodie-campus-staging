import { Result } from '@woodie/domain';
import { 
  IAssignmentRepository,
  UniqueEntityID
} from '@woodie/domain';
import { UseCase } from '../../use-cases/UseCase';

export interface ArchiveAssignmentInput {
  assignmentId: string;
  teacherId: string;
}

export interface ArchiveAssignmentOutput {
  assignmentId: string;
  status: string;
  message: string;
  archivedAt: Date;
}

export class ArchiveAssignmentUseCase implements UseCase<ArchiveAssignmentInput, ArchiveAssignmentOutput> {
  constructor(
    private assignmentRepository: IAssignmentRepository
  ) {}

  async execute(request: ArchiveAssignmentInput): Promise<Result<ArchiveAssignmentOutput>> {
    try {
      // 1. 입력 검증
      if (!request.assignmentId?.trim()) {
        return Result.fail<ArchiveAssignmentOutput>('Assignment ID is required');
      }

      if (!request.teacherId?.trim()) {
        return Result.fail<ArchiveAssignmentOutput>('Teacher ID is required');
      }

      // 2. 과제 조회
      const assignmentId = new UniqueEntityID(request.assignmentId.trim());
      const assignmentResult = await this.assignmentRepository.findById(assignmentId);

      if (assignmentResult.isFailure) {
        return Result.fail<ArchiveAssignmentOutput>(`Assignment not found: ${assignmentResult.error}`);
      }

      const assignment = assignmentResult.value;

      // 3. 권한 검증
      if (!assignment.isOwnedBy(request.teacherId.trim())) {
        return Result.fail<ArchiveAssignmentOutput>('Only the assignment owner can archive assignments');
      }

      // 4. 보관 처리
      assignment.archive();

      // 5. 저장
      const saveResult = await this.assignmentRepository.save(assignment);
      if (saveResult.isFailure) {
        return Result.fail<ArchiveAssignmentOutput>(`Failed to save assignment: ${saveResult.error}`);
      }

      // 6. Output DTO 생성
      const output: ArchiveAssignmentOutput = {
        assignmentId: request.assignmentId,
        status: assignment.status,
        message: 'Assignment successfully archived',
        archivedAt: assignment.updatedAt
      };

      return Result.ok<ArchiveAssignmentOutput>(output);

    } catch (error) {
      return Result.fail<ArchiveAssignmentOutput>(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }
}