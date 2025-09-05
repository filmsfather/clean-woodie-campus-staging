import { Result } from '@woodie/domain';
import { UniqueEntityID } from '@woodie/domain';
export class ChangeDueDateUseCase {
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
            if (!request.newDueDate) {
                return Result.fail('New due date is required');
            }
            // 2. 과제 조회 (현재 마감일 확인용)
            const assignmentId = new UniqueEntityID(request.assignmentId.trim());
            const assignmentResult = await this.assignmentService['assignmentRepository'].findById(assignmentId);
            if (assignmentResult.isFailure) {
                return Result.fail(`Assignment not found: ${assignmentResult.error}`);
            }
            const assignment = assignmentResult.value;
            const previousDueDate = assignment.dueDate.value;
            // 3. 도메인 서비스를 통한 마감일 변경
            const changeResult = await this.assignmentService.changeAssignmentDueDate(assignmentId, request.newDueDate, request.teacherId.trim(), request.timezone);
            if (changeResult.isFailure) {
                return Result.fail(changeResult.error);
            }
            // 4. Output DTO 생성
            const output = {
                assignmentId: request.assignmentId,
                previousDueDate,
                newDueDate: request.newDueDate,
                message: `Assignment due date changed${request.reason ? ` - Reason: ${request.reason}` : ''}`
            };
            return Result.ok(output);
        }
        catch (error) {
            return Result.fail(error instanceof Error ? error.message : 'Unknown error occurred');
        }
    }
}
//# sourceMappingURL=ChangeDueDateUseCase.js.map