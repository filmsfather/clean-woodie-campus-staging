import { Result } from '@woodie/domain';
import { UniqueEntityID } from '@woodie/domain';
export class ExtendDueDateUseCase {
    assignmentService;
    constructor(assignmentService) {
        this.assignmentService = assignmentService;
    }
    async execute(request) {
        try {
            // 1. 입력 검증
            if (!request.assignmentId?.trim()) {
                return Result.fail('Assignment ID is required');
            }
            if (!request.teacherId?.trim()) {
                return Result.fail('Teacher ID is required');
            }
            if (!request.additionalHours || request.additionalHours <= 0) {
                return Result.fail('Additional hours must be greater than 0');
            }
            // 2. 과제 조회 (현재 마감일 확인용)
            const assignmentId = new UniqueEntityID(request.assignmentId.trim());
            const assignmentResult = await this.assignmentService['assignmentRepository'].findById(assignmentId);
            if (assignmentResult.isFailure) {
                return Result.fail(`Assignment not found: ${assignmentResult.error}`);
            }
            const assignment = assignmentResult.value;
            const previousDueDate = assignment.dueDate.value;
            // 3. 도메인 서비스를 통한 마감일 연장
            const extendResult = await this.assignmentService.extendAssignmentDueDate(assignmentId, request.additionalHours, request.teacherId.trim());
            if (extendResult.isFailure) {
                return Result.fail(extendResult.error);
            }
            // 4. 업데이트된 과제 정보 조회
            const updatedAssignmentResult = await this.assignmentService['assignmentRepository'].findById(assignmentId);
            if (updatedAssignmentResult.isFailure) {
                return Result.fail(`Failed to retrieve updated assignment: ${updatedAssignmentResult.error}`);
            }
            const updatedAssignment = updatedAssignmentResult.value;
            // 5. Output DTO 생성
            const output = {
                assignmentId: request.assignmentId,
                previousDueDate,
                newDueDate: updatedAssignment.dueDate.value,
                extendedHours: request.additionalHours,
                message: `Assignment due date extended by ${request.additionalHours} hour(s)${request.reason ? ` - Reason: ${request.reason}` : ''}`
            };
            return Result.ok(output);
        }
        catch (error) {
            return Result.fail(error instanceof Error ? error.message : 'Unknown error occurred');
        }
    }
}
//# sourceMappingURL=ExtendDueDateUseCase.js.map