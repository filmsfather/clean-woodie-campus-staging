import { Result } from '@woodie/domain';
export class GetDueSoonAssignmentsUseCase {
    assignmentService;
    constructor(assignmentService) {
        this.assignmentService = assignmentService;
    }
    async execute(request) {
        try {
            // 1. 기본값 설정
            const hoursThreshold = request.hoursThreshold || 24;
            // 2. 도메인 서비스를 통해 마감 임박 과제 조회
            const dueSoonAssignmentsResult = await this.assignmentService.getAssignmentsDueSoon(hoursThreshold);
            if (dueSoonAssignmentsResult.isFailure) {
                return Result.fail(dueSoonAssignmentsResult.error);
            }
            let dueSoonAssignments = dueSoonAssignmentsResult.value;
            // 3. 특정 교사 필터링
            if (request.teacherId?.trim()) {
                dueSoonAssignments = dueSoonAssignments.filter(assignment => assignment.isOwnedBy(request.teacherId.trim()));
            }
            // 4. 비활성 과제 필터링
            if (!request.includeInactive) {
                dueSoonAssignments = dueSoonAssignments.filter(assignment => assignment.status === 'ACTIVE');
            }
            // 5. Output DTO 생성
            const assignmentSummaries = dueSoonAssignments.map(assignment => {
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
            const teacherCounts = {};
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
            const output = {
                hoursThreshold,
                assignments: assignmentSummaries,
                summary
            };
            return Result.ok(output);
        }
        catch (error) {
            return Result.fail(error instanceof Error ? error.message : 'Unknown error occurred');
        }
    }
}
//# sourceMappingURL=GetDueSoonAssignmentsUseCase.js.map