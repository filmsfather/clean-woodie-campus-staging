import { Result } from '@woodie/domain';
export class GetAssignmentsForClassUseCase {
    assignmentService;
    constructor(assignmentService) {
        this.assignmentService = assignmentService;
    }
    async execute(request) {
        try {
            // 1. 입력 검증
            if (!request.classId?.trim()) {
                return Result.fail('Class ID is required');
            }
            if (!request.requesterId?.trim()) {
                return Result.fail('Requester ID is required');
            }
            // 2. 도메인 서비스를 통해 반에 배정된 과제 조회
            const assignmentsResult = await this.assignmentService.getAssignmentsForClass(request.classId.trim());
            if (assignmentsResult.isFailure) {
                return Result.fail(assignmentsResult.error);
            }
            let assignments = assignmentsResult.value;
            // 3. 권한 확인 - 요청자가 해당 과제들의 소유자인지 확인
            // (실제 환경에서는 더 세밀한 권한 체계가 필요할 수 있음)
            assignments = assignments.filter(assignment => assignment.isOwnedBy(request.requesterId.trim()));
            // 4. 필터링 처리
            if (!request.includeInactive) {
                assignments = assignments.filter(assignment => assignment.status !== 'DRAFT');
            }
            if (!request.includeArchived) {
                assignments = assignments.filter(assignment => assignment.status !== 'ARCHIVED');
            }
            // 5. Output DTO 생성
            const assignmentSummaries = assignments.map(assignment => ({
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
            const output = {
                classId: request.classId,
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
//# sourceMappingURL=GetAssignmentsForClassUseCase.js.map