import { Result } from '@woodie/domain';
import { UniqueEntityID } from '@woodie/domain';
export class ArchiveAssignmentUseCase {
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
            if (!request.teacherId?.trim()) {
                return Result.fail('Teacher ID is required');
            }
            // 2. 과제 조회
            const assignmentId = new UniqueEntityID(request.assignmentId.trim());
            const assignmentResult = await this.assignmentRepository.findById(assignmentId);
            if (assignmentResult.isFailure) {
                return Result.fail(`Assignment not found: ${assignmentResult.error}`);
            }
            const assignment = assignmentResult.value;
            // 3. 권한 검증
            if (!assignment.isOwnedBy(request.teacherId.trim())) {
                return Result.fail('Only the assignment owner can archive assignments');
            }
            // 4. 보관 처리
            assignment.archive();
            // 5. 저장
            const saveResult = await this.assignmentRepository.save(assignment);
            if (saveResult.isFailure) {
                return Result.fail(`Failed to save assignment: ${saveResult.error}`);
            }
            // 6. Output DTO 생성
            const output = {
                assignmentId: request.assignmentId,
                status: assignment.status,
                message: 'Assignment successfully archived',
                archivedAt: assignment.updatedAt
            };
            return Result.ok(output);
        }
        catch (error) {
            return Result.fail(error instanceof Error ? error.message : 'Unknown error occurred');
        }
    }
}
//# sourceMappingURL=ArchiveAssignmentUseCase.js.map