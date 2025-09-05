import { Result } from '@woodie/domain';
import { 
  AssignmentService,
  UniqueEntityID
} from '@woodie/domain';
import { UseCase } from '../../use-cases/UseCase';

export interface ActivateAssignmentInput {
  assignmentId: string;
  teacherId: string;
}

export interface ActivateAssignmentOutput {
  assignmentId: string;
  status: string;
  activatedAt: Date;
  message: string;
}

export class ActivateAssignmentUseCase implements UseCase<ActivateAssignmentInput, ActivateAssignmentOutput> {
  constructor(
    private assignmentService: AssignmentService
  ) {}

  async execute(request: ActivateAssignmentInput): Promise<Result<ActivateAssignmentOutput>> {
    try {
      // 1. 입력 검증
      if (!request.assignmentId?.trim()) {
        return Result.fail<ActivateAssignmentOutput>('Assignment ID is required');
      }

      if (!request.teacherId?.trim()) {
        return Result.fail<ActivateAssignmentOutput>('Teacher ID is required');
      }

      // 2. 도메인 서비스를 통한 활성화
      const assignmentId = new UniqueEntityID(request.assignmentId.trim());
      const activateResult = await this.assignmentService.activateAssignment(
        assignmentId, 
        request.teacherId.trim()
      );

      if (activateResult.isFailure) {
        return Result.fail<ActivateAssignmentOutput>(activateResult.error);
      }

      // 3. Output DTO 생성
      const output: ActivateAssignmentOutput = {
        assignmentId: request.assignmentId,
        status: 'ACTIVE',
        activatedAt: new Date(),
        message: 'Assignment successfully activated'
      };

      return Result.ok<ActivateAssignmentOutput>(output);

    } catch (error) {
      return Result.fail<ActivateAssignmentOutput>(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }
}