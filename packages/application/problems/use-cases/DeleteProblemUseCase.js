import { Result, UniqueEntityID } from '@woodie/domain';
export class DeleteProblemUseCase {
    problemRepository;
    constructor(problemRepository) {
        this.problemRepository = problemRepository;
    }
    async execute(request) {
        try {
            // 1. 입력 검증
            if (!request.problemId?.trim()) {
                return Result.fail('Problem ID is required');
            }
            if (!request.teacherId?.trim()) {
                return Result.fail('Teacher ID is required');
            }
            // 2. 문제 조회
            const problemResult = await this.problemRepository.findById(new UniqueEntityID(request.problemId.trim()));
            if (problemResult.isFailure) {
                return Result.fail(`Failed to find problem: ${problemResult.errorValue}`);
            }
            if (!problemResult.value) {
                return Result.fail('Problem not found');
            }
            const problem = problemResult.value;
            // 3. 권한 검증 (소유자만 삭제 가능)
            if (!problem.isOwnedBy(request.teacherId)) {
                return Result.fail('Access denied: Only problem owner can delete problem');
            }
            // 4. 삭제 방식에 따른 처리
            if (request.hardDelete === true) {
                // 물리적 삭제
                const deleteResult = await this.problemRepository.delete(problem.id);
                if (deleteResult.isFailure) {
                    return Result.fail(`Failed to delete problem: ${deleteResult.errorValue}`);
                }
                return Result.ok(undefined);
            }
            else {
                // 논리적 삭제 (비활성화)
                const deactivateResult = problem.deactivate();
                if (deactivateResult.isFailure) {
                    return Result.fail(`Failed to deactivate problem: ${deactivateResult.errorValue}`);
                }
                const saveResult = await this.problemRepository.save(problem);
                if (saveResult.isFailure) {
                    return Result.fail(`Failed to save problem: ${saveResult.errorValue}`);
                }
                return Result.ok(undefined);
            }
        }
        catch (error) {
            return Result.fail(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
//# sourceMappingURL=DeleteProblemUseCase.js.map