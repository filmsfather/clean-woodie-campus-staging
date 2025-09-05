import { Result } from '@woodie/domain';
import { 
  AssignmentService,
  UniqueEntityID
} from '@woodie/domain';
import { UseCase } from '../../use-cases/UseCase';

export interface ChangeDueDateInput {
  assignmentId: string;
  newDueDate: Date;
  timezone?: string;
  teacherId: string;
  reason?: string;
}

export interface ChangeDueDateOutput {
  assignmentId: string;
  previousDueDate: Date;
  newDueDate: Date;
  message: string;
}

export class ChangeDueDateUseCase implements UseCase<ChangeDueDateInput, ChangeDueDateOutput> {
  constructor(
    private assignmentService: AssignmentService
  ) {}

  async execute(request: ChangeDueDateInput): Promise<Result<ChangeDueDateOutput>> {
    try {
      // 1. 입력 검증
      if (!request.assignmentId?.trim()) {
        return Result.fail<ChangeDueDateOutput>('Assignment ID is required');
      }

      if (!request.teacherId?.trim()) {
        return Result.fail<ChangeDueDateOutput>('Teacher ID is required');
      }

      if (!request.newDueDate) {
        return Result.fail<ChangeDueDateOutput>('New due date is required');
      }

      // 2. 과제 조회 (현재 마감일 확인용)
      const assignmentId = new UniqueEntityID(request.assignmentId.trim());
      const assignmentResult = await this.assignmentService['assignmentRepository'].findById(assignmentId);

      if (assignmentResult.isFailure) {
        return Result.fail<ChangeDueDateOutput>(`Assignment not found: ${assignmentResult.error}`);
      }

      const assignment = assignmentResult.value;
      const previousDueDate = assignment.dueDate.value;

      // 3. 도메인 서비스를 통한 마감일 변경
      const changeResult = await this.assignmentService.changeAssignmentDueDate(
        assignmentId,
        request.newDueDate,
        request.teacherId.trim(),
        request.timezone
      );

      if (changeResult.isFailure) {
        return Result.fail<ChangeDueDateOutput>(changeResult.error);
      }

      // 4. Output DTO 생성
      const output: ChangeDueDateOutput = {
        assignmentId: request.assignmentId,
        previousDueDate,
        newDueDate: request.newDueDate,
        message: `Assignment due date changed${request.reason ? ` - Reason: ${request.reason}` : ''}`
      };

      return Result.ok<ChangeDueDateOutput>(output);

    } catch (error) {
      return Result.fail<ChangeDueDateOutput>(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }
}