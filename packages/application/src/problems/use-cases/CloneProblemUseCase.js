import { Result, UniqueEntityID } from '@woodie/domain';
export class CloneProblemUseCase {
    problemRepository;
    constructor(problemRepository) {
        this.problemRepository = problemRepository;
    }
    async execute(request) {
        try {
            // 1. 입력 검증
            if (!request.sourceProblemId?.trim()) {
                return Result.fail('Source problem ID is required');
            }
            if (!request.newTeacherId?.trim()) {
                return Result.fail('New teacher ID is required');
            }
            if (!request.requesterId?.trim()) {
                return Result.fail('Requester ID is required');
            }
            // 2. 원본 문제 조회
            const sourceProblemResult = await this.problemRepository.findById(new UniqueEntityID(request.sourceProblemId.trim()));
            if (sourceProblemResult.isFailure) {
                return Result.fail(`Failed to find source problem: ${sourceProblemResult.errorValue}`);
            }
            if (!sourceProblemResult.value) {
                return Result.fail('Source problem not found');
            }
            const sourceProblem = sourceProblemResult.value;
            // 3. 권한 검증
            // 활성화된 문제는 모든 교사가 복제 가능, 비활성화된 문제는 소유자만 복제 가능
            if (!sourceProblem.isActive && !sourceProblem.isOwnedBy(request.requesterId)) {
                return Result.fail('Access denied: Inactive problem can only be cloned by owner');
            }
            // 4. 사용 전 검증 (원본 문제가 유효해야 복제 가능)
            const validationResult = sourceProblem.validateForUse();
            if (validationResult.isFailure) {
                return Result.fail(`Cannot clone invalid problem: ${validationResult.errorValue}`);
            }
            // 5. 문제 복제
            const cloneResult = sourceProblem.clone(request.newTeacherId.trim());
            if (cloneResult.isFailure) {
                return Result.fail(`Failed to clone problem: ${cloneResult.errorValue}`);
            }
            const clonedProblem = cloneResult.value;
            // 6. 복제된 문제 저장
            const saveResult = await this.problemRepository.save(clonedProblem);
            if (saveResult.isFailure) {
                return Result.fail(`Failed to save cloned problem: ${saveResult.errorValue}`);
            }
            // 7. 응답 구성
            const response = {
                originalProblem: this.mapToDto(sourceProblem),
                clonedProblem: this.mapToDto(clonedProblem)
            };
            return Result.ok(response);
        }
        catch (error) {
            return Result.fail(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    mapToDto(problem) {
        return {
            id: problem.id.toString(),
            teacherId: problem.teacherId,
            title: problem.content.title,
            description: problem.content.description,
            type: problem.type.value,
            difficulty: problem.difficulty.level,
            tags: problem.tags.map(tag => tag.name),
            isActive: problem.isActive,
            createdAt: problem.createdAt.toISOString(),
            updatedAt: problem.updatedAt.toISOString()
        };
    }
}
//# sourceMappingURL=CloneProblemUseCase.js.map