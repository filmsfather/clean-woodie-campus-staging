import { Result } from '@woodie/domain';
import { UniqueEntityID } from '@woodie/domain';
export class AssignToClassUseCase {
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
            if (!request.classIds || request.classIds.length === 0) {
                return Result.fail('At least one class ID is required');
            }
            // 2. 과제 조회
            const assignmentId = new UniqueEntityID(request.assignmentId.trim());
            const assignmentResult = await this.assignmentService['assignmentRepository'].findById(assignmentId);
            if (assignmentResult.isFailure) {
                return Result.fail(`Assignment not found: ${assignmentResult.error}`);
            }
            const assignment = assignmentResult.value;
            // 3. 권한 검증
            if (!assignment.isOwnedBy(request.teacherId.trim())) {
                return Result.fail('Only the assignment owner can assign to classes');
            }
            // 4. 도메인 서비스를 통한 배정 처리
            const assignResult = await this.assignmentService.assignTargets(assignment, {
                classIds: request.classIds.map(id => id.trim()),
                studentIds: undefined
            }, request.teacherId.trim());
            if (assignResult.isFailure) {
                return Result.fail(assignResult.error);
            }
            // 5. 저장은 assignTargets 메서드 내에서 처리됨
            // 6. Output DTO 생성
            const output = {
                assignmentId: request.assignmentId,
                assignedClassIds: request.classIds,
                totalTargets: assignment.getActiveAssignmentCount(),
                message: `Assignment successfully assigned to ${request.classIds.length} class(es)`
            };
            return Result.ok(output);
        }
        catch (error) {
            return Result.fail(error instanceof Error ? error.message : 'Unknown error occurred');
        }
    }
}
//# sourceMappingURL=AssignToClassUseCase.js.map