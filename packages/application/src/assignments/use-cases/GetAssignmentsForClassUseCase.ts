import { Result } from '@woodie/domain';
import { 
  AssignmentService
} from '@woodie/domain';
import { UseCase } from '../../use-cases/UseCase';

export interface GetAssignmentsForClassInput {
  classId: string;
  requesterId: string; // 권한 확인용 (교사 ID)
  includeInactive?: boolean;
  includeArchived?: boolean;
}

export interface ClassAssignmentSummary {
  id: string;
  title: string;
  description?: string;
  dueDate: Date;
  maxAttempts?: number;
  status: string;
  problemSetId: string;
  teacherId: string;
  createdAt: Date;
  dueDateStatus: {
    isOverdue: boolean;
    isDueSoon: boolean;
    hoursUntilDue: number;
    daysUntilDue: number;
    statusMessage: string;
  };
  targetInfo: {
    totalTargets: number;
    isAssignedToClass: boolean;
    hasIndividualAssignments: boolean;
  };
  accessibility: {
    isAccessible: boolean;
    canSubmit: boolean;
  };
}

export interface GetAssignmentsForClassOutput {
  classId: string;
  assignments: ClassAssignmentSummary[];
  summary: {
    totalCount: number;
    activeCount: number;
    draftCount: number;
    closedCount: number;
    archivedCount: number;
    overdueCount: number;
    dueSoonCount: number;
  };
}

export class GetAssignmentsForClassUseCase implements UseCase<GetAssignmentsForClassInput, GetAssignmentsForClassOutput> {
  constructor(
    private assignmentService: AssignmentService
  ) {}

  async execute(request: GetAssignmentsForClassInput): Promise<Result<GetAssignmentsForClassOutput>> {
    try {
      // 1. 입력 검증
      if (!request.classId?.trim()) {
        return Result.fail<GetAssignmentsForClassOutput>('Class ID is required');
      }

      if (!request.requesterId?.trim()) {
        return Result.fail<GetAssignmentsForClassOutput>('Requester ID is required');
      }

      // 2. 도메인 서비스를 통해 반에 배정된 과제 조회
      const assignmentsResult = await this.assignmentService.getAssignmentsForClass(
        request.classId.trim()
      );

      if (assignmentsResult.isFailure) {
        return Result.fail<GetAssignmentsForClassOutput>(assignmentsResult.error);
      }

      let assignments = assignmentsResult.value;

      // 3. 권한 확인 - 요청자가 해당 과제들의 소유자인지 확인
      // (실제 환경에서는 더 세밀한 권한 체계가 필요할 수 있음)
      assignments = assignments.filter(assignment => 
        assignment.isOwnedBy(request.requesterId.trim())
      );

      // 4. 필터링 처리
      if (!request.includeInactive) {
        assignments = assignments.filter(assignment => 
          assignment.status !== 'DRAFT'
        );
      }

      if (!request.includeArchived) {
        assignments = assignments.filter(assignment => 
          assignment.status !== 'ARCHIVED'
        );
      }

      // 5. Output DTO 생성
      const assignmentSummaries: ClassAssignmentSummary[] = assignments.map(assignment => ({
        id: assignment.id.toString(),
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.dueDate.value,
        maxAttempts: assignment.maxAttempts,
        status: assignment.status,
        problemSetId: assignment.problemSetId.toString(),
        teacherId: assignment.teacherId,
        createdAt: assignment.createdAt,
        dueDateStatus: {
          isOverdue: assignment.isOverdue(),
          isDueSoon: assignment.isDueSoon(),
          hoursUntilDue: assignment.getHoursUntilDue(),
          daysUntilDue: assignment.getDaysUntilDue(),
          statusMessage: assignment.getDueDateStatus()
        },
        targetInfo: {
          totalTargets: assignment.getActiveAssignmentCount(),
          isAssignedToClass: assignment.getAssignedClasses().length > 0,
          hasIndividualAssignments: assignment.getAssignedStudents().length > 0
        },
        accessibility: {
          isAccessible: assignment.isAccessibleToStudents(),
          canSubmit: assignment.isActive() && !assignment.isOverdue()
        }
      }));

      // 6. 요약 정보 계산
      const summary = {
        totalCount: assignmentSummaries.length,
        activeCount: assignmentSummaries.filter(a => a.status === 'ACTIVE').length,
        draftCount: assignmentSummaries.filter(a => a.status === 'DRAFT').length,
        closedCount: assignmentSummaries.filter(a => a.status === 'CLOSED').length,
        archivedCount: assignmentSummaries.filter(a => a.status === 'ARCHIVED').length,
        overdueCount: assignmentSummaries.filter(a => a.dueDateStatus.isOverdue).length,
        dueSoonCount: assignmentSummaries.filter(a => a.dueDateStatus.isDueSoon && !a.dueDateStatus.isOverdue).length
      };

      const output: GetAssignmentsForClassOutput = {
        classId: request.classId,
        assignments: assignmentSummaries,
        summary
      };

      return Result.ok<GetAssignmentsForClassOutput>(output);

    } catch (error) {
      return Result.fail<GetAssignmentsForClassOutput>(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }
}