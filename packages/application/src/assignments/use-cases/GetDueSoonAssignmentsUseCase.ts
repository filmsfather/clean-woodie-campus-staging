import { Result } from '@woodie/domain';
import { 
  AssignmentService
} from '@woodie/domain';
import { UseCase } from '../../use-cases/UseCase';

export interface GetDueSoonAssignmentsInput {
  hoursThreshold?: number; // 마감 임박 기준 시간 (기본값: 24시간)
  teacherId?: string; // 특정 교사의 과제만 조회 (선택적)
  includeInactive?: boolean;
}

export interface DueSoonAssignmentSummary {
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
  assignmentInfo: {
    totalTargets: number;
    activeTargets: number;
    assignedClasses: string[];
    assignedStudents: string[];
  };
}

export interface GetDueSoonAssignmentsOutput {
  hoursThreshold: number;
  assignments: DueSoonAssignmentSummary[];
  summary: {
    totalDueSoonCount: number;
    criticalCount: number; // 24시간 이내
    highCount: number; // 48시간 이내
    mediumCount: number; // 그 외
    activeCount: number;
    teacherCounts: Record<string, number>; // 교사별 마감 임박 과제 수
  };
}

export class GetDueSoonAssignmentsUseCase implements UseCase<GetDueSoonAssignmentsInput, GetDueSoonAssignmentsOutput> {
  constructor(
    private assignmentService: AssignmentService
  ) {}

  async execute(request: GetDueSoonAssignmentsInput): Promise<Result<GetDueSoonAssignmentsOutput>> {
    try {
      // 1. 기본값 설정
      const hoursThreshold = request.hoursThreshold || 24;

      // 2. 도메인 서비스를 통해 마감 임박 과제 조회
      const dueSoonAssignmentsResult = await this.assignmentService.getAssignmentsDueSoon(hoursThreshold);

      if (dueSoonAssignmentsResult.isFailure) {
        return Result.fail<GetDueSoonAssignmentsOutput>(dueSoonAssignmentsResult.error);
      }

      let dueSoonAssignments = dueSoonAssignmentsResult.value;

      // 3. 특정 교사 필터링
      if (request.teacherId?.trim()) {
        dueSoonAssignments = dueSoonAssignments.filter(assignment => 
          assignment.isOwnedBy(request.teacherId!.trim())
        );
      }

      // 4. 비활성 과제 필터링
      if (!request.includeInactive) {
        dueSoonAssignments = dueSoonAssignments.filter(assignment => 
          assignment.status === 'ACTIVE'
        );
      }

      // 5. Output DTO 생성
      const assignmentSummaries: DueSoonAssignmentSummary[] = dueSoonAssignments.map(assignment => {
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
          assignmentInfo: {
            totalTargets: assignment.targets.length,
            activeTargets: assignment.getActiveAssignmentCount(),
            assignedClasses: assignment.getAssignedClasses().map(classId => classId.value),
            assignedStudents: assignment.getAssignedStudents().map(studentId => studentId.value)
          }
        };
      });

      // 6. 요약 정보 계산
      const teacherCounts: Record<string, number> = {};
      assignmentSummaries.forEach(assignment => {
        const teacherId = assignment.teacherId;
        teacherCounts[teacherId] = (teacherCounts[teacherId] || 0) + 1;
      });

      const summary = {
        totalDueSoonCount: assignmentSummaries.length,
        criticalCount: assignmentSummaries.filter(a => a.dueDateStatus.hoursUntilDue <= 24).length,
        highCount: assignmentSummaries.filter(a => a.dueDateStatus.hoursUntilDue > 24 && a.dueDateStatus.hoursUntilDue <= 48).length,
        mediumCount: assignmentSummaries.filter(a => a.dueDateStatus.hoursUntilDue > 48).length,
        activeCount: assignmentSummaries.filter(a => a.status === 'ACTIVE').length,
        teacherCounts
      };

      const output: GetDueSoonAssignmentsOutput = {
        hoursThreshold,
        assignments: assignmentSummaries,
        summary
      };

      return Result.ok<GetDueSoonAssignmentsOutput>(output);

    } catch (error) {
      return Result.fail<GetDueSoonAssignmentsOutput>(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }
}