import { Result } from '@woodie/domain';
import { UniqueEntityID } from '@woodie/domain';
export class ActivateAssignmentUseCase {
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
            // 2. 도메인 서비스를 통한 활성화
            const assignmentId = new UniqueEntityID(request.assignmentId.trim());
            const activateResult = await this.assignmentService.activateAssignment(assignmentId, request.teacherId.trim());
            if (activateResult.isFailure) {
                return Result.fail(activateResult.error);
            }
            // 3. Output DTO 생성
            const output = {
                assignmentId: request.assignmentId,
                status: 'ACTIVE',
                activatedAt: new Date(),
                message: 'Assignment successfully activated'
            };
            return Result.ok(output);
        }
        catch (error) {
            return Result.fail(error instanceof Error ? error.message : 'Unknown error occurred');
        }
    }
}
//# sourceMappingURL=ActivateAssignmentUseCase.js.map