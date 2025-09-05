import { Result } from '@woodie/domain';
import { UniqueEntityID } from '@woodie/domain';
export class GetAssignmentUseCase {
    assignmentRepository;
    constructor(assignmentRepository) {
        this.assignmentRepository = assignmentRepository;
    }
    async execute(request) {
        try {
            // 1. 입력 검증
            if (!request.assignmentId?.trim()) {
                return Result.fail('Assignment ID is required');
            }
            if (!request.requesterId?.trim()) {
                return Result.fail('Requester ID is required');
            }
            // 2. 과제 조회
            const assignmentId = new UniqueEntityID(request.assignmentId.trim());
            const assignmentResult = await this.assignmentRepository.findById(assignmentId);
            if (assignmentResult.isFailure) {
                return Result.fail(`Assignment not found: ${assignmentResult.error}`);
            }
            const assignment = assignmentResult.value;
            // 3. 권한 확인 (소유자인지 또는 접근 권한이 있는지)
            const isOwner = assignment.isOwnedBy(request.requesterId.trim());
            // TODO: 실제 환경에서는 학생의 경우 배정된 과제만 조회 가능하도록 해야 함
            // const isAssignedStudent = assignment.isAssignedToStudent(...);
            if (!isOwner) {
                // 추가 권한 검증 로직이 필요할 수 있음
                // 현재는 소유자만 상세 조회 가능하도록 제한
                return Result.fail('Access denied: insufficient permissions');
            }
            // 4. Output DTO 생성
            const output = {
                id: assignment.id.toString(),
                teacherId: assignment.teacherId,
                problemSetId: assignment.problemSetId.toString(),
                title: assignment.title,
                description: assignment.description,
                dueDate: assignment.dueDate.value,
                maxAttempts: assignment.maxAttempts,
                status: assignment.status,
                createdAt: assignment.createdAt,
                updatedAt: assignment.updatedAt,
                dueDateStatus: {
                    isOverdue: assignment.isOverdue(),
                    isDueSoon: assignment.isDueSoon(),
                    hoursUntilDue: assignment.getHoursUntilDue(),
                    daysUntilDue: assignment.getDaysUntilDue(),
                    statusMessage: assignment.getDueDateStatus()
                },
                targets: {
                    totalCount: assignment.targets.length,
                    activeCount: assignment.getActiveAssignmentCount(),
                    assignedClasses: assignment.getAssignedClasses().map(classId => classId.value),
                    assignedStudents: assignment.getAssignedStudents().map(studentId => studentId.value)
                },
                permissions: {
                    canEdit: isOwner,
                    canDelete: isOwner,
                    canActivate: isOwner && !assignment.isActive(),
                    canAssign: isOwner
                }
            };
            return Result.ok(output);
        }
        catch (error) {
            return Result.fail(error instanceof Error ? error.message : 'Unknown error occurred');
        }
    }
}
//# sourceMappingURL=GetAssignmentUseCase.js.map