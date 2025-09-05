import { Result } from '@woodie/domain';
import { 
  AssignmentService
} from '@woodie/domain';
import { UseCase } from '../../use-cases/UseCase';

export interface GetOverdueAssignmentsInput {
  teacherId?: string; // 특정 교사의 과제만 조회 (선택적)
  includeArchived?: boolean;
}

export interface OverdueAssignmentSummary {
  id: string;
  title: string;
  description?: string;
  dueDate: Date;
  maxAttempts?: number;
  status: string;
  teacherId: string;
  problemSetId: string;
  dueDateStatus: {
    isOverdue: boolean;
    isDueSoon: boolean;
    hoursUntilDue: number;
    daysUntilDue: number;
    statusMessage: string;
  };
  overdueInfo: {
    daysPastDue: number;
    hasBeenNotified: boolean;
    lastNotificationDate?: string;
  };
  assignmentInfo: {
    totalTargets: number;
    activeTargets: number;
    assignedClasses: string[];
    assignedStudents: string[];
  };
}

export interface GetOverdueAssignmentsOutput {
  assignments: OverdueAssignmentSummary[];
  summary: {
    totalOverdueCount: number;
    activeOverdueCount: number;
    teacherCounts: Record<string, number>; // 교사별 마감된 과제 수
  };
}

export class GetOverdueAssignmentsUseCase implements UseCase<GetOverdueAssignmentsInput, GetOverdueAssignmentsOutput> {
  constructor(
    private assignmentService: AssignmentService
  ) {}

  async execute(request: GetOverdueAssignmentsInput): Promise<Result<GetOverdueAssignmentsOutput>> {
    try {
      // 1. 도메인 서비스를 통해 마감된 과제 조회
      const overdueAssignmentsResult = await this.assignmentService.getOverdueAssignments();

      if (overdueAssignmentsResult.isFailure) {
        return Result.fail<GetOverdueAssignmentsOutput>(overdueAssignmentsResult.error);
      }

      let overdueAssignments = overdueAssignmentsResult.value;

      // 2. 특정 교사 필터링
      if (request.teacherId?.trim()) {
        overdueAssignments = overdueAssignments.filter(assignment => 
          assignment.isOwnedBy(request.teacherId!.trim())
        );
      }

      // 3. 보관된 과제 필터링
      if (!request.includeArchived) {
        overdueAssignments = overdueAssignments.filter(assignment => 
          assignment.status !== 'ARCHIVED'
        );
      }

      // 4. Output DTO 생성
      const assignmentSummaries: OverdueAssignmentSummary[] = overdueAssignments.map(assignment => {
        const daysPastDue = Math.abs(assignment.getDaysUntilDue());

        return {
          id: assignment.id.toString(),
          title: assignment.title,
          description: assignment.description,
          dueDate: assignment.dueDate.value,
          maxAttempts: assignment.maxAttempts,
          status: assignment.status,
          teacherId: assignment.teacherId,
          problemSetId: assignment.problemSetId.toString(),
          dueDateStatus: {
            isOverdue: assignment.isOverdue(),
            isDueSoon: assignment.isDueSoon(),
            hoursUntilDue: assignment.getHoursUntilDue(),
            daysUntilDue: assignment.getDaysUntilDue(),
            statusMessage: assignment.getDueDateStatus()
          },
          overdueInfo: {
            daysPastDue,
            hasBeenNotified: false, // TODO: 실제 알림 이력에서 가져와야 함
            lastNotificationDate: undefined // TODO: 실제 알림 이력에서 가져와야 함
          },
          assignmentInfo: {
            totalTargets: assignment.targets.length,
            activeTargets: assignment.getActiveAssignmentCount(),
            assignedClasses: assignment.getAssignedClasses().map(classId => classId.value),
            assignedStudents: assignment.getAssignedStudents().map(studentId => studentId.value)
          }
        };
      });

      // 5. 요약 정보 계산
      const teacherCounts: Record<string, number> = {};
      assignmentSummaries.forEach(assignment => {
        const teacherId = assignment.teacherId;
        teacherCounts[teacherId] = (teacherCounts[teacherId] || 0) + 1;
      });

      const summary = {
        totalOverdueCount: assignmentSummaries.length,
        activeOverdueCount: assignmentSummaries.filter(a => a.status === 'ACTIVE').length,
        teacherCounts
      };

      const output: GetOverdueAssignmentsOutput = {
        assignments: assignmentSummaries,
        summary
      };

      return Result.ok<GetOverdueAssignmentsOutput>(output);

    } catch (error) {
      return Result.fail<GetOverdueAssignmentsOutput>(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }
}