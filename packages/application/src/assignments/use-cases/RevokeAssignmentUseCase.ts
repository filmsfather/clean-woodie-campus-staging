import { Result } from '@woodie/domain';
import { 
  AssignmentService,
  UniqueEntityID
} from '@woodie/domain';
import { UseCase } from '../../use-cases/UseCase';

export interface RevokeAssignmentInput {
  assignmentId: string;
  classIds?: string[];
  studentIds?: string[];
  teacherId: string;
}

export interface RevokeAssignmentOutput {
  assignmentId: string;
  revokedClassIds?: string[];
  revokedStudentIds?: string[];
  remainingTargets: number;
  message: string;
}

export class RevokeAssignmentUseCase implements UseCase<RevokeAssignmentInput, RevokeAssignmentOutput> {
  constructor(
    private assignmentService: AssignmentService
  ) {}

  async execute(request: RevokeAssignmentInput): Promise<Result<RevokeAssignmentOutput>> {
    try {
      // 1. 입력 검증
      if (!request.assignmentId?.trim()) {
        return Result.fail<RevokeAssignmentOutput>('Assignment ID is required');
      }

      if (!request.teacherId?.trim()) {
        return Result.fail<RevokeAssignmentOutput>('Teacher ID is required');
      }

      if (!request.classIds?.length && !request.studentIds?.length) {
        return Result.fail<RevokeAssignmentOutput>('At least one class ID or student ID is required');
      }

      // 2. 도메인 서비스를 통한 배정 취소 처리
      const assignmentId = new UniqueEntityID(request.assignmentId.trim());
      const revokeResult = await this.assignmentService.revokeAssignmentTargets(
        assignmentId,
        {
          classIds: request.classIds?.map(id => id.trim()),
          studentIds: request.studentIds?.map(id => id.trim())
        },
        request.teacherId.trim()
      );

      if (revokeResult.isFailure) {
        return Result.fail<RevokeAssignmentOutput>(revokeResult.error);
      }

      // 3. 업데이트된 과제 정보 조회 (남은 배정 수 확인용)
      const assignmentResult = await this.assignmentService['assignmentRepository'].findById(assignmentId);
      let remainingTargets = 0;
      
      if (assignmentResult.isSuccess) {
        remainingTargets = assignmentResult.value.getActiveAssignmentCount();
      }

      // 4. Output DTO 생성
      const totalRevoked = (request.classIds?.length || 0) + (request.studentIds?.length || 0);
      const output: RevokeAssignmentOutput = {
        assignmentId: request.assignmentId,
        revokedClassIds: request.classIds,
        revokedStudentIds: request.studentIds,
        remainingTargets,
        message: `Assignment successfully revoked from ${totalRevoked} target(s)`
      };

      return Result.ok<RevokeAssignmentOutput>(output);

    } catch (error) {
      return Result.fail<RevokeAssignmentOutput>(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }
}