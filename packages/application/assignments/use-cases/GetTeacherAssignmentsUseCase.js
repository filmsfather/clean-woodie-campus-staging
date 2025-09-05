import { Result } from '@woodie/domain';
export class GetTeacherAssignmentsUseCase {
    assignmentRepository;
    assignmentService;
    constructor(assignmentRepository, assignmentService) {
        this.assignmentRepository = assignmentRepository;
        this.assignmentService = assignmentService;
    }
    async execute(request) {
        try {
            // 1. 입력 검증
            if (!request.teacherId?.trim()) {
                return Result.fail('Teacher ID is required');
            }
            // 2. 교사의 과제 목록 조회
            const assignmentsResult = await this.assignmentRepository.findByTeacherId(request.teacherId.trim());
            if (assignmentsResult.isFailure) {
                return Result.fail(assignmentsResult.error);
            }
            let assignments = assignmentsResult.value;
            // 3. 상태별 필터링
            if (request.status && request.status !== 'ALL') {
                assignments = assignments.filter(assignment => assignment.status === request.status);
            }
            // 4. 보관된 과제 필터링
            if (!request.includeArchived) {
                assignments = assignments.filter(assignment => assignment.status !== 'ARCHIVED');
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
            const output = {
                teacherId: request.teacherId,
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
//# sourceMappingURL=GetTeacherAssignmentsUseCase.js.map