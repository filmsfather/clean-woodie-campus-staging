import { Result } from '@woodie/domain';
import { 
  AssignmentService
} from '@woodie/domain';
import { UseCase } from '../../use-cases/UseCase';

export interface GetAssignmentsForStudentInput {
  studentId: string;
  includeCompleted?: boolean;
  includePastDue?: boolean;
}

export interface StudentAssignmentSummary {
  id: string;
  title: string;
  description?: string;
  dueDate: Date;
  maxAttempts?: number;
  status: string;
  problemSetId: string;
  teacherId: string;
  dueDateStatus: {
    isOverdue: boolean;
    isDueSoon: boolean;
    hoursUntilDue: number;
    daysUntilDue: number;
  };
  accessibility: {
    isAccessible: boolean;
    canSubmit: boolean;
  };
}

export interface GetAssignmentsForStudentOutput {
  studentId: string;
  assignments: StudentAssignmentSummary[];
  summary: {
    totalCount: number;
    activeCount: number;
    overdueCount: number;
    dueSoonCount: number;
  };
}

export class GetAssignmentsForStudentUseCase implements UseCase<GetAssignmentsForStudentInput, GetAssignmentsForStudentOutput> {
  constructor(
    private assignmentService: AssignmentService
  ) {}

  async execute(request: GetAssignmentsForStudentInput): Promise<Result<GetAssignmentsForStudentOutput>> {
    try {
      // 1. 입력 검증
      if (!request.studentId?.trim()) {
        return Result.fail<GetAssignmentsForStudentOutput>('Student ID is required');
      }

      // 2. 도메인 서비스를 통해 학생이 접근 가능한 과제 조회
      const assignmentsResult = await this.assignmentService.getAccessibleAssignmentsForStudent(
        request.studentId.trim()
      );

      if (assignmentsResult.isFailure) {
        return Result.fail<GetAssignmentsForStudentOutput>(assignmentsResult.error);
      }

      const assignments = assignmentsResult.value;

      // 3. 필터링 처리
      let filteredAssignments = assignments;

      if (!request.includeCompleted) {
        // 완료된 과제 제외 (실제로는 제출 상태를 확인해야 함)
        // 현재는 CLOSED, ARCHIVED 상태만 제외
        filteredAssignments = filteredAssignments.filter(assignment => 
          assignment.status !== 'CLOSED' && assignment.status !== 'ARCHIVED'
        );
      }

      if (!request.includePastDue) {
        // 마감된 과제 제외
        filteredAssignments = filteredAssignments.filter(assignment => 
          !assignment.isOverdue()
        );
      }

      // 4. Output DTO 생성
      const assignmentSummaries: StudentAssignmentSummary[] = filteredAssignments.map(assignment => ({
        id: assignment.id.toString(),
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.dueDate.value,
        maxAttempts: assignment.maxAttempts,
        status: assignment.status,
        problemSetId: assignment.problemSetId.toString(),
        teacherId: assignment.teacherId,
        dueDateStatus: {
          isOverdue: assignment.isOverdue(),
          isDueSoon: assignment.isDueSoon(),
          hoursUntilDue: assignment.getHoursUntilDue(),
          daysUntilDue: assignment.getDaysUntilDue()
        },
        accessibility: {
          isAccessible: assignment.isAccessibleToStudents(),
          canSubmit: assignment.isActive() && !assignment.isOverdue()
        }
      }));

      // 5. 요약 정보 계산
      const summary = {
        totalCount: assignmentSummaries.length,
        activeCount: assignmentSummaries.filter(a => a.status === 'ACTIVE').length,
        overdueCount: assignmentSummaries.filter(a => a.dueDateStatus.isOverdue).length,
        dueSoonCount: assignmentSummaries.filter(a => a.dueDateStatus.isDueSoon && !a.dueDateStatus.isOverdue).length
      };

      const output: GetAssignmentsForStudentOutput = {
        studentId: request.studentId,
        assignments: assignmentSummaries,
        summary
      };

      return Result.ok<GetAssignmentsForStudentOutput>(output);

    } catch (error) {
      return Result.fail<GetAssignmentsForStudentOutput>(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }
}