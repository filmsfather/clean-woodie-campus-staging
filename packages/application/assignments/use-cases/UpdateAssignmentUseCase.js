import { Result } from '@woodie/domain';
import { UniqueEntityID, DueDate } from '@woodie/domain';
export class UpdateAssignmentUseCase {
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
                return Result.fail('Only the assignment owner can update assignments');
            }
            // 4. 업데이트 처리
            // 제목 업데이트
            if (request.title !== undefined) {
                const updateTitleResult = assignment.updateTitle(request.title);
                if (updateTitleResult.isFailure) {
                    return Result.fail(updateTitleResult.error);
                }
            }
            // 설명 업데이트
            if (request.description !== undefined) {
                const updateDescResult = assignment.updateDescription(request.description);
                if (updateDescResult.isFailure) {
                    return Result.fail(updateDescResult.error);
                }
            }
            // 마감일 업데이트
            if (request.dueDate) {
                const dueDateResult = DueDate.create(request.dueDate, request.timezone);
                if (dueDateResult.isFailure) {
                    return Result.fail(`Invalid due date: ${dueDateResult.error}`);
                }
                const updateDueDateResult = assignment.updateDueDate(dueDateResult.value);
                if (updateDueDateResult.isFailure) {
                    return Result.fail(updateDueDateResult.error);
                }
            }
            // 시도 횟수 업데이트
            if (request.unlimitedAttempts) {
                assignment.setUnlimitedAttempts();
            }
            else if (request.maxAttempts !== undefined) {
                const setAttemptsResult = assignment.setMaxAttempts(request.maxAttempts);
                if (setAttemptsResult.isFailure) {
                    return Result.fail(setAttemptsResult.error);
                }
            }
            // 5. 저장
            const saveResult = await this.assignmentRepository.save(assignment);
            if (saveResult.isFailure) {
                return Result.fail(`Failed to save assignment: ${saveResult.error}`);
            }
            // 6. Output DTO 생성
            const output = {
                assignmentId: assignment.id.toString(),
                title: assignment.title,
                description: assignment.description,
                dueDate: assignment.dueDate.value,
                maxAttempts: assignment.maxAttempts,
                status: assignment.status.valueOf(),
                updatedAt: assignment.updatedAt
            };
            return Result.ok(output);
        }
        catch (error) {
            return Result.fail(error instanceof Error ? error.message : 'Unknown error occurred');
        }
    }
}
//# sourceMappingURL=UpdateAssignmentUseCase.js.map