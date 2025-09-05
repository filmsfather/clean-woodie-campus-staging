import { Result } from '@woodie/domain';
import { 
  AssignmentService,
  UniqueEntityID
} from '@woodie/domain';
import { UseCase } from '../../use-cases/UseCase';

export interface AssignToClassInput {
  assignmentId: string;
  classIds: string[];
  teacherId: string;
}

export interface AssignToClassOutput {
  assignmentId: string;
  assignedClassIds: string[];
  totalTargets: number;
  message: string;
}

export class AssignToClassUseCase implements UseCase<AssignToClassInput, AssignToClassOutput> {
  constructor(
    private assignmentService: AssignmentService
  ) {}

  async execute(request: AssignToClassInput): Promise<Result<AssignToClassOutput>> {
    try {
      // 1. 입력 검증
      if (!request.assignmentId?.trim()) {
        return Result.fail<AssignToClassOutput>('Assignment ID is required');
      }

      if (!request.teacherId?.trim()) {
        return Result.fail<AssignToClassOutput>('Teacher ID is required');
      }

      if (!request.classIds || request.classIds.length === 0) {
        return Result.fail<AssignToClassOutput>('At least one class ID is required');
      }

      // 2. 과제 조회
      const assignmentId = new UniqueEntityID(request.assignmentId.trim());
      const assignmentResult = await this.assignmentService['assignmentRepository'].findById(assignmentId);

      if (assignmentResult.isFailure) {
        return Result.fail<AssignToClassOutput>(`Assignment not found: ${assignmentResult.error}`);
      }

      const assignment = assignmentResult.value;

      // 3. 권한 검증
      if (!assignment.isOwnedBy(request.teacherId.trim())) {
        return Result.fail<AssignToClassOutput>('Only the assignment owner can assign to classes');
      }

      // 4. 도메인 서비스를 통한 배정 처리
      const assignResult = await this.assignmentService.assignTargets(
        assignment,
        {
          classIds: request.classIds.map(id => id.trim()),
          studentIds: undefined
        },
        request.teacherId.trim()
      );

      if (assignResult.isFailure) {
        return Result.fail<AssignToClassOutput>(assignResult.error);
      }

      // 5. 저장은 assignTargets 메서드 내에서 처리됨

      // 6. Output DTO 생성
      const output: AssignToClassOutput = {
        assignmentId: request.assignmentId,
        assignedClassIds: request.classIds,
        totalTargets: assignment.getActiveAssignmentCount(),
        message: `Assignment successfully assigned to ${request.classIds.length} class(es)`
      };

      return Result.ok<AssignToClassOutput>(output);

    } catch (error) {
      return Result.fail<AssignToClassOutput>(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }
}