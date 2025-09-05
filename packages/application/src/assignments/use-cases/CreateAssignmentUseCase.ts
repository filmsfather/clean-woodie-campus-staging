import { Result } from '@woodie/domain';
import { 
  Assignment, 
  AssignmentService,
  IAssignmentRepository,
  UniqueEntityID,
  DueDate
} from '@woodie/domain';
import { UseCase } from '../../use-cases/UseCase';

export interface CreateAssignmentInput {
  teacherId: string;
  problemSetId: string;
  title: string;
  description?: string;
  dueDate: Date;
  timezone?: string;
  maxAttempts?: number;
  classIds?: string[];
  studentIds?: string[];
}

export interface CreateAssignmentOutput {
  assignmentId: string;
  title: string;
  status: string;
  dueDate: Date;
  hasTargets: boolean;
  targetCount: number;
}

export class CreateAssignmentUseCase implements UseCase<CreateAssignmentInput, CreateAssignmentOutput> {
  constructor(
    private assignmentRepository: IAssignmentRepository,
    private assignmentService: AssignmentService
  ) {}

  async execute(request: CreateAssignmentInput): Promise<Result<CreateAssignmentOutput>> {
    try {
      // 1. 입력 검증
      if (!request.teacherId?.trim()) {
        return Result.fail<CreateAssignmentOutput>('Teacher ID is required');
      }

      if (!request.problemSetId?.trim()) {
        return Result.fail<CreateAssignmentOutput>('Problem set ID is required');
      }

      if (!request.title?.trim()) {
        return Result.fail<CreateAssignmentOutput>('Assignment title is required');
      }

      if (!request.dueDate) {
        return Result.fail<CreateAssignmentOutput>('Due date is required');
      }

      // 2. 도메인 서비스를 통한 과제 생성 (배정 대상과 함께)
      const createResult = await this.assignmentService.createAssignmentWithTargets({
        teacherId: request.teacherId.trim(),
        problemSetId: new UniqueEntityID(request.problemSetId.trim()),
        title: request.title.trim(),
        description: request.description?.trim(),
        dueDate: request.dueDate,
        timezone: request.timezone,
        maxAttempts: request.maxAttempts,
        classIds: request.classIds,
        studentIds: request.studentIds
      }, request.teacherId.trim());

      if (createResult.isFailure) {
        return Result.fail<CreateAssignmentOutput>(createResult.error);
      }

      const assignment = createResult.value;

      // 3. Output DTO 생성
      const output: CreateAssignmentOutput = {
        assignmentId: assignment.id.toString(),
        title: assignment.title,
        status: assignment.status,
        dueDate: assignment.dueDate.value,
        hasTargets: assignment.hasActiveAssignments(),
        targetCount: assignment.getActiveAssignmentCount()
      };

      return Result.ok<CreateAssignmentOutput>(output);

    } catch (error) {
      return Result.fail<CreateAssignmentOutput>(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }
}