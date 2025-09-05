import { Result } from '@woodie/domain';
import { 
  AssignmentService,
  UniqueEntityID
} from '@woodie/domain';
import { UseCase } from '../../use-cases/UseCase';

export interface ExtendDueDateInput {
  assignmentId: string;
  additionalHours: number;
  teacherId: string;
  reason?: string;
}

export interface ExtendDueDateOutput {
  assignmentId: string;
  previousDueDate: Date;
  newDueDate: Date;
  extendedHours: number;
  message: string;
}

export class ExtendDueDateUseCase implements UseCase<ExtendDueDateInput, ExtendDueDateOutput> {
  constructor(
    private assignmentService: AssignmentService
  ) {}

  async execute(request: ExtendDueDateInput): Promise<Result<ExtendDueDateOutput>> {
    try {
      // 1. 입력 검증
      if (!request.assignmentId?.trim()) {
        return Result.fail<ExtendDueDateOutput>('Assignment ID is required');
      }

      if (!request.teacherId?.trim()) {
        return Result.fail<ExtendDueDateOutput>('Teacher ID is required');
      }

      if (!request.additionalHours || request.additionalHours <= 0) {
        return Result.fail<ExtendDueDateOutput>('Additional hours must be greater than 0');
      }

      // 2. 과제 조회 (현재 마감일 확인용)
      const assignmentId = new UniqueEntityID(request.assignmentId.trim());
      const assignmentResult = await this.assignmentService['assignmentRepository'].findById(assignmentId);

      if (assignmentResult.isFailure) {
        return Result.fail<ExtendDueDateOutput>(`Assignment not found: ${assignmentResult.error}`);
      }

      const assignment = assignmentResult.value;
      const previousDueDate = assignment.dueDate.value;

      // 3. 도메인 서비스를 통한 마감일 연장
      const extendResult = await this.assignmentService.extendAssignmentDueDate(
        assignmentId,
        request.additionalHours,
        request.teacherId.trim()
      );

      if (extendResult.isFailure) {
        return Result.fail<ExtendDueDateOutput>(extendResult.error);
      }

      // 4. 업데이트된 과제 정보 조회
      const updatedAssignmentResult = await this.assignmentService['assignmentRepository'].findById(assignmentId);
      
      if (updatedAssignmentResult.isFailure) {
        return Result.fail<ExtendDueDateOutput>(`Failed to retrieve updated assignment: ${updatedAssignmentResult.error}`);
      }

      const updatedAssignment = updatedAssignmentResult.value;

      // 5. Output DTO 생성
      const output: ExtendDueDateOutput = {
        assignmentId: request.assignmentId,
        previousDueDate,
        newDueDate: updatedAssignment.dueDate.value,
        extendedHours: request.additionalHours,
        message: `Assignment due date extended by ${request.additionalHours} hour(s)${request.reason ? ` - Reason: ${request.reason}` : ''}`
      };

      return Result.ok<ExtendDueDateOutput>(output);

    } catch (error) {
      return Result.fail<ExtendDueDateOutput>(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }
}