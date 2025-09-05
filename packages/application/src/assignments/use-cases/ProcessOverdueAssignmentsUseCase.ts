import { Result } from '@woodie/domain';
import { 
  AssignmentService
} from '@woodie/domain';
import { UseCase } from '../../use-cases/UseCase';

export interface ProcessOverdueAssignmentsInput {
  dryRun?: boolean; // true일 경우 실제 처리하지 않고 예상 결과만 반환
  teacherId?: string; // 특정 교사의 과제만 처리 (선택적)
}

export interface ProcessedAssignmentSummary {
  id: string;
  title: string;
  teacherId: string;
  previousStatus: string;
  newStatus: string;
  dueDate: Date;
  hoursPastDue: number;
  daysPastDue: number;
  totalTargets: number;
  processedAt: Date;
}

export interface ProcessOverdueAssignmentsOutput {
  dryRun: boolean;
  processedCount: number;
  skippedCount: number;
  errorCount: number;
  processedAssignments: ProcessedAssignmentSummary[];
  errors: Array<{
    assignmentId: string;
    title: string;
    error: string;
  }>;
  summary: {
    totalOverdueFound: number;
    activeOverdueClosed: number;
    alreadyClosedSkipped: number;
    teacherProcessCounts: Record<string, number>; // 교사별 처리된 과제 수
  };
  executionTime: number; // 실행 시간 (밀리초)
}

export class ProcessOverdueAssignmentsUseCase implements UseCase<ProcessOverdueAssignmentsInput, ProcessOverdueAssignmentsOutput> {
  constructor(
    private assignmentService: AssignmentService
  ) {}

  async execute(request: ProcessOverdueAssignmentsInput): Promise<Result<ProcessOverdueAssignmentsOutput>> {
    const startTime = Date.now();
    
    try {
      const isDryRun = request.dryRun === true;
      
      // 1. 마감된 과제 조회
      const overdueAssignmentsResult = await this.assignmentService.getOverdueAssignments();

      if (overdueAssignmentsResult.isFailure) {
        return Result.fail<ProcessOverdueAssignmentsOutput>(overdueAssignmentsResult.error);
      }

      let overdueAssignments = overdueAssignmentsResult.value;

      // 2. 특정 교사 필터링
      if (request.teacherId?.trim()) {
        overdueAssignments = overdueAssignments.filter(assignment => 
          assignment.isOwnedBy(request.teacherId!.trim())
        );
      }

      // 3. 처리 결과 초기화
      const processedAssignments: ProcessedAssignmentSummary[] = [];
      const errors: Array<{ assignmentId: string; title: string; error: string; }> = [];
      let processedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;
      const teacherProcessCounts: Record<string, number> = {};

      // 4. 각 과제 처리
      for (const assignment of overdueAssignments) {
        try {
          const previousStatus = assignment.status;
          
          // 이미 마감된 과제는 건너뛰기
          if (assignment.status === 'CLOSED' || assignment.status === 'ARCHIVED') {
            skippedCount++;
            continue;
          }

          // Dry run이 아닐 경우에만 실제 처리
          if (!isDryRun) {
            const processResult = await this.assignmentService.processOverdueAssignments();
            
            if (processResult.isFailure) {
              errors.push({
                assignmentId: assignment.id.toString(),
                title: assignment.title,
                error: processResult.error
              });
              errorCount++;
              continue;
            }
          }

          // 처리된 과제 정보 추가
          const hoursPastDue = Math.abs(assignment.getHoursUntilDue());
          const daysPastDue = Math.abs(assignment.getDaysUntilDue());
          
          processedAssignments.push({
            id: assignment.id.toString(),
            title: assignment.title,
            teacherId: assignment.teacherId,
            previousStatus,
            newStatus: isDryRun ? 'CLOSED' : 'CLOSED', // Dry run에서는 예상 상태
            dueDate: assignment.dueDate.value,
            hoursPastDue,
            daysPastDue,
            totalTargets: assignment.getActiveAssignmentCount(),
            processedAt: new Date()
          });

          // 교사별 처리 카운트 업데이트
          const teacherId = assignment.teacherId;
          teacherProcessCounts[teacherId] = (teacherProcessCounts[teacherId] || 0) + 1;
          
          processedCount++;

        } catch (error) {
          errors.push({
            assignmentId: assignment.id.toString(),
            title: assignment.title,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          errorCount++;
        }
      }

      // 5. 실행 시간 계산
      const executionTime = Date.now() - startTime;

      // 6. 요약 정보 생성
      const summary = {
        totalOverdueFound: overdueAssignments.length,
        activeOverdueClosed: processedCount,
        alreadyClosedSkipped: skippedCount,
        teacherProcessCounts
      };

      const output: ProcessOverdueAssignmentsOutput = {
        dryRun: isDryRun,
        processedCount,
        skippedCount,
        errorCount,
        processedAssignments,
        errors,
        summary,
        executionTime
      };

      return Result.ok<ProcessOverdueAssignmentsOutput>(output);

    } catch (error) {
      return Result.fail<ProcessOverdueAssignmentsOutput>(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }
}