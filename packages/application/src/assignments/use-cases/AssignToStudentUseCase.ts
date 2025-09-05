import { Result } from '@woodie/domain';
import { 
  AssignmentService,
  UniqueEntityID
} from '@woodie/domain';
import { UseCase } from '../../use-cases/UseCase';

export interface AssignToStudentInput {
  assignmentId: string;
  studentIds: string[];
  teacherId: string;
}

export interface AssignToStudentOutput {
  assignmentId: string;
  assignedStudentIds: string[];
  totalTargets: number;
  message: string;
}

export class AssignToStudentUseCase implements UseCase<AssignToStudentInput, AssignToStudentOutput> {
  constructor(
    private assignmentService: AssignmentService
  ) {}

  async execute(request: AssignToStudentInput): Promise<Result<AssignToStudentOutput>> {
    try {
      // 1. 입력 검증
      if (!request.assignmentId?.trim()) {
        return Result.fail<AssignToStudentOutput>('Assignment ID is required');
      }

      if (!request.teacherId?.trim()) {
        return Result.fail<AssignToStudentOutput>('Teacher ID is required');
      }

      if (!request.studentIds || request.studentIds.length === 0) {
        return Result.fail<AssignToStudentOutput>('At least one student ID is required');
      }

      // 2. 과제 조회
      const assignmentId = new UniqueEntityID(request.assignmentId.trim());
      const assignmentResult = await this.assignmentService['assignmentRepository'].findById(assignmentId);

      if (assignmentResult.isFailure) {
        return Result.fail<AssignToStudentOutput>(`Assignment not found: ${assignmentResult.error}`);
      }

      const assignment = assignmentResult.value;

      // 3. 권한 검증
      if (!assignment.isOwnedBy(request.teacherId.trim())) {
        return Result.fail<AssignToStudentOutput>('Only the assignment owner can assign to students');
      }

      // 4. 도메인 서비스를 통한 배정 처리
      const assignResult = await this.assignmentService.assignTargets(
        assignment,
        {
          classIds: undefined,
          studentIds: request.studentIds.map(id => id.trim())
        },
        request.teacherId.trim()
      );

      if (assignResult.isFailure) {
        return Result.fail<AssignToStudentOutput>(assignResult.error);
      }

      // 5. 저장은 assignTargets 메서드 내에서 처리됨

      // 6. Output DTO 생성
      const output: AssignToStudentOutput = {
        assignmentId: request.assignmentId,
        assignedStudentIds: request.studentIds,
        totalTargets: assignment.getActiveAssignmentCount(),
        message: `Assignment successfully assigned to ${request.studentIds.length} student(s)`
      };

      return Result.ok<AssignToStudentOutput>(output);

    } catch (error) {
      return Result.fail<AssignToStudentOutput>(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }
}