import { Result } from '@woodie/domain';
import { UniqueEntityID } from '@woodie/domain';
export class CreateAssignmentUseCase {
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
            if (!request.problemSetId?.trim()) {
                return Result.fail('Problem set ID is required');
            }
            if (!request.title?.trim()) {
                return Result.fail('Assignment title is required');
            }
            if (!request.dueDate) {
                return Result.fail('Due date is required');
            }
            // 2. 도메인 서비스를 통한 과제 생성 (배정 대상과 함께)
            const createResult = await this.assignmentService.createAssignmentWithTargets({
                teacherId: request.teacherId.trim(),
                problemSetId: new UniqueEntityID(request.problemSetId.trim()),
                title: request.title.trim(),
                description: request.description?.trim(),
                dueDate: request.dueDate,
                timezone: request.timezone,
                maxAttempts: request.maxAttempts,
                classIds: request.classIds,
                studentIds: request.studentIds
            }, request.teacherId.trim());
            if (createResult.isFailure) {
                return Result.fail(createResult.error);
            }
            const assignment = createResult.value;
            // 3. Output DTO 생성
            const output = {
                assignmentId: assignment.id.toString(),
                title: assignment.title,
                status: assignment.status,
                dueDate: assignment.dueDate.value,
                hasTargets: assignment.hasActiveAssignments(),
                targetCount: assignment.getActiveAssignmentCount()
            };
            return Result.ok(output);
        }
        catch (error) {
            return Result.fail(error instanceof Error ? error.message : 'Unknown error occurred');
        }
    }
}
//# sourceMappingURL=CreateAssignmentUseCase.js.map