import { Result } from '@woodie/domain';
export class GetOverdueAssignmentsUseCase {
    assignmentService;
    constructor(assignmentService) {
        this.assignmentService = assignmentService;
    }
    async execute(request) {
        try {
            // 1. 도메인 서비스를 통해 마감된 과제 조회
            const overdueAssignmentsResult = await this.assignmentService.getOverdueAssignments();
            if (overdueAssignmentsResult.isFailure) {
                return Result.fail(overdueAssignmentsResult.error);
            }
            let overdueAssignments = overdueAssignmentsResult.value;
            // 2. 특정 교사 필터링
            if (request.teacherId?.trim()) {
                overdueAssignments = overdueAssignments.filter(assignment => assignment.isOwnedBy(request.teacherId.trim()));
            }
            // 3. 보관된 과제 필터링
            if (!request.includeArchived) {
                overdueAssignments = overdueAssignments.filter(assignment => assignment.status !== 'ARCHIVED');
            }
            // 4. Output DTO 생성
            const assignmentSummaries = overdueAssignments.map(assignment => {
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
            const teacherCounts = {};
            assignmentSummaries.forEach(assignment => {
                const teacherId = assignment.teacherId;
                teacherCounts[teacherId] = (teacherCounts[teacherId] || 0) + 1;
            });
            const summary = {
                totalOverdueCount: assignmentSummaries.length,
                activeOverdueCount: assignmentSummaries.filter(a => a.status === 'ACTIVE').length,
                teacherCounts
            };
            const output = {
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
//# sourceMappingURL=GetOverdueAssignmentsUseCase.js.map