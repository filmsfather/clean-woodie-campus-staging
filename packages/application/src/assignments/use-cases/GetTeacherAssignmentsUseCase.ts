import { Result } from '@woodie/domain';
import { 
  IAssignmentRepository,
  AssignmentService
} from '@woodie/domain';
import { UseCase } from '../../use-cases/UseCase';

export interface GetTeacherAssignmentsInput {
  teacherId: string;
  status?: string; // 'ACTIVE', 'DRAFT', 'CLOSED', 'ARCHIVED' 또는 'ALL'
  includeArchived?: boolean;
  sortBy?: 'dueDate' | 'createdAt' | 'title' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface TeacherAssignmentSummary {
  id: string;
  title: string;
  description?: string;
  dueDate: Date;
  maxAttempts?: number;
  status: string;
  problemSetId: string;
  teacherId: string;
  createdAt: Date;
  updatedAt: Date;
  dueDateStatus: {
    isOverdue: boolean;
    isDueSoon: boolean;
    hoursUntilDue: number;
    daysUntilDue: number;
    statusMessage: string;
  };
  targetInfo: {
    totalTargets: number;
    activeTargets: number;
    assignedClasses: string[];
    assignedStudents: string[];
    hasActiveAssignments: boolean;
  };
  permissions: {
    canActivate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canAssign: boolean;
  };
}

export interface GetTeacherAssignmentsOutput {
  teacherId: string;
  assignments: TeacherAssignmentSummary[];
  summary: {
    totalCount: number;
    draftCount: number;
    activeCount: number;
    closedCount: number;
    archivedCount: number;
    overdueCount: number;
    dueSoonCount: number;
  };
}

export class GetTeacherAssignmentsUseCase implements UseCase<GetTeacherAssignmentsInput, GetTeacherAssignmentsOutput> {
  constructor(
    private assignmentRepository: IAssignmentRepository,
    private assignmentService: AssignmentService
  ) {}

  async execute(request: GetTeacherAssignmentsInput): Promise<Result<GetTeacherAssignmentsOutput>> {
    try {
      // 1. 입력 검증
      if (!request.teacherId?.trim()) {
        return Result.fail<GetTeacherAssignmentsOutput>('Teacher ID is required');
      }

      // 2. 교사의 과제 목록 조회
      const assignmentsResult = await this.assignmentRepository.findByTeacherId(request.teacherId.trim());

      if (assignmentsResult.isFailure) {
        return Result.fail<GetTeacherAssignmentsOutput>(assignmentsResult.error);
      }

      let assignments = assignmentsResult.value;

      // 3. 상태별 필터링
      if (request.status && request.status !== 'ALL') {
        assignments = assignments.filter(assignment => 
          assignment.status === request.status
        );
      }

      // 4. 보관된 과제 필터링
      if (!request.includeArchived) {
        assignments = assignments.filter(assignment => 
          assignment.status !== 'ARCHIVED'
        );
      }

      // 5. 정렬 처리
      if (request.sortBy) {
        assignments.sort((a, b) => {
          let comparison = 0;
          
          switch (request.sortBy) {
            case 'dueDate':
              comparison = a.dueDate.value.getTime() - b.dueDate.value.getTime();
              break;
            case 'createdAt':
              comparison = a.createdAt.getTime() - b.createdAt.getTime();
              break;
            case 'title':
              comparison = a.title.localeCompare(b.title);
              break;
            case 'status':
              comparison = a.status.localeCompare(b.status);
              break;
            default:
              comparison = 0;
          }
          
          return request.sortOrder === 'desc' ? -comparison : comparison;
        });
      }

      // 6. Output DTO 생성
      const assignmentSummaries: TeacherAssignmentSummary[] = assignments.map(assignment => ({
        id: assignment.id.toString(),
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.dueDate.value,
        maxAttempts: assignment.maxAttempts,
        status: assignment.status,
        problemSetId: assignment.problemSetId.toString(),
        teacherId: assignment.teacherId,
        createdAt: assignment.createdAt,
        updatedAt: assignment.updatedAt,
        dueDateStatus: {
          isOverdue: assignment.isOverdue(),
          isDueSoon: assignment.isDueSoon(),
          hoursUntilDue: assignment.getHoursUntilDue(),
          daysUntilDue: assignment.getDaysUntilDue(),
          statusMessage: assignment.getDueDateStatus()
        },
        targetInfo: {
          totalTargets: assignment.targets.length,
          activeTargets: assignment.getActiveAssignmentCount(),
          assignedClasses: assignment.getAssignedClasses().map(classId => classId.value),
          assignedStudents: assignment.getAssignedStudents().map(studentId => studentId.value),
          hasActiveAssignments: assignment.hasActiveAssignments()
        },
        permissions: {
          canActivate: assignment.status === 'DRAFT' && assignment.hasActiveAssignments(),
          canEdit: assignment.status !== 'ARCHIVED',
          canDelete: true,
          canAssign: true
        }
      }));

      // 7. 요약 정보 계산
      const summary = {
        totalCount: assignmentSummaries.length,
        draftCount: assignmentSummaries.filter(a => a.status === 'DRAFT').length,
        activeCount: assignmentSummaries.filter(a => a.status === 'ACTIVE').length,
        closedCount: assignmentSummaries.filter(a => a.status === 'CLOSED').length,
        archivedCount: assignmentSummaries.filter(a => a.status === 'ARCHIVED').length,
        overdueCount: assignmentSummaries.filter(a => a.dueDateStatus.isOverdue).length,
        dueSoonCount: assignmentSummaries.filter(a => a.dueDateStatus.isDueSoon && !a.dueDateStatus.isOverdue).length
      };

      const output: GetTeacherAssignmentsOutput = {
        teacherId: request.teacherId,
        assignments: assignmentSummaries,
        summary
      };

      return Result.ok<GetTeacherAssignmentsOutput>(output);

    } catch (error) {
      return Result.fail<GetTeacherAssignmentsOutput>(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }
}