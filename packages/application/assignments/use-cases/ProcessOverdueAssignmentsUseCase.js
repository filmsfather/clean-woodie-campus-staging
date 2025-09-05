import { Result } from '@woodie/domain';
export class ProcessOverdueAssignmentsUseCase {
    assignmentService;
    constructor(assignmentService) {
        this.assignmentService = assignmentService;
    }
    async execute(request) {
        const startTime = Date.now();
        try {
            const isDryRun = request.dryRun === true;
            // 1. 마감된 과제 조회
            const overdueAssignmentsResult = await this.assignmentService.getOverdueAssignments();
            if (overdueAssignmentsResult.isFailure) {
                return Result.fail(overdueAssignmentsResult.error);
            }
            let overdueAssignments = overdueAssignmentsResult.value;
            // 2. 특정 교사 필터링
            if (request.teacherId?.trim()) {
                overdueAssignments = overdueAssignments.filter(assignment => assignment.isOwnedBy(request.teacherId.trim()));
            }
            // 3. 처리 결과 초기화
            const processedAssignments = [];
            const errors = [];
            let processedCount = 0;
            let skippedCount = 0;
            let errorCount = 0;
            const teacherProcessCounts = {};
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
                }
                catch (error) {
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
            const output = {
                dryRun: isDryRun,
                processedCount,
                skippedCount,
                errorCount,
                processedAssignments,
                errors,
                summary,
                executionTime
            };
            return Result.ok(output);
        }
        catch (error) {
            return Result.fail(error instanceof Error ? error.message : 'Unknown error occurred');
        }
    }
}
//# sourceMappingURL=ProcessOverdueAssignmentsUseCase.js.map