import { Result } from '@woodie/domain';
import { 
  Assignment, 
  IAssignmentRepository,
  UniqueEntityID,
  DueDate
} from '@woodie/domain';
import { UseCase } from '../../use-cases/UseCase';

export interface UpdateAssignmentInput {
  assignmentId: string;
  teacherId: string; // 권한 검증용
  title?: string;
  description?: string;
  dueDate?: Date;
  timezone?: string;
  maxAttempts?: number;
  unlimitedAttempts?: boolean;
}

export interface UpdateAssignmentOutput {
  assignmentId: string;
  title: string;
  description?: string;
  dueDate: Date;
  maxAttempts?: number;
  status: string;
  updatedAt: Date;
}

export class UpdateAssignmentUseCase implements UseCase<UpdateAssignmentInput, UpdateAssignmentOutput> {
  constructor(
    private assignmentRepository: IAssignmentRepository
  ) {}

  async execute(request: UpdateAssignmentInput): Promise<Result<UpdateAssignmentOutput>> {
    try {
      // 1. 입력 검증
      if (!request.assignmentId?.trim()) {
        return Result.fail<UpdateAssignmentOutput>('Assignment ID is required');
      }

      if (!request.teacherId?.trim()) {
        return Result.fail<UpdateAssignmentOutput>('Teacher ID is required');
      }

      // 2. 과제 조회
      const assignmentId = new UniqueEntityID(request.assignmentId.trim());
      const assignmentResult = await this.assignmentRepository.findById(assignmentId);

      if (assignmentResult.isFailure) {
        return Result.fail<UpdateAssignmentOutput>(`Assignment not found: ${assignmentResult.error}`);
      }

      const assignment = assignmentResult.value;

      // 3. 권한 검증
      if (!assignment.isOwnedBy(request.teacherId.trim())) {
        return Result.fail<UpdateAssignmentOutput>('Only the assignment owner can update assignments');
      }

      // 4. 업데이트 처리
      
      // 제목 업데이트
      if (request.title !== undefined) {
        const updateTitleResult = assignment.updateTitle(request.title);
        if (updateTitleResult.isFailure) {
          return Result.fail<UpdateAssignmentOutput>(updateTitleResult.error);
        }
      }

      // 설명 업데이트
      if (request.description !== undefined) {
        const updateDescResult = assignment.updateDescription(request.description);
        if (updateDescResult.isFailure) {
          return Result.fail<UpdateAssignmentOutput>(updateDescResult.error);
        }
      }

      // 마감일 업데이트
      if (request.dueDate) {
        const dueDateResult = DueDate.create(request.dueDate, request.timezone);
        if (dueDateResult.isFailure) {
          return Result.fail<UpdateAssignmentOutput>(`Invalid due date: ${dueDateResult.error}`);
        }

        const updateDueDateResult = assignment.updateDueDate(dueDateResult.value);
        if (updateDueDateResult.isFailure) {
          return Result.fail<UpdateAssignmentOutput>(updateDueDateResult.error);
        }
      }

      // 시도 횟수 업데이트
      if (request.unlimitedAttempts) {
        assignment.setUnlimitedAttempts();
      } else if (request.maxAttempts !== undefined) {
        const setAttemptsResult = assignment.setMaxAttempts(request.maxAttempts);
        if (setAttemptsResult.isFailure) {
          return Result.fail<UpdateAssignmentOutput>(setAttemptsResult.error);
        }
      }

      // 5. 저장
      const saveResult = await this.assignmentRepository.save(assignment);
      if (saveResult.isFailure) {
        return Result.fail<UpdateAssignmentOutput>(`Failed to save assignment: ${saveResult.error}`);
      }

      // 6. Output DTO 생성
      const output: UpdateAssignmentOutput = {
        assignmentId: assignment.id.toString(),
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.dueDate.value,
        maxAttempts: assignment.maxAttempts,
        status: assignment.status.valueOf(),
        updatedAt: assignment.updatedAt
      };

      return Result.ok<UpdateAssignmentOutput>(output);

    } catch (error) {
      return Result.fail<UpdateAssignmentOutput>(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }
}