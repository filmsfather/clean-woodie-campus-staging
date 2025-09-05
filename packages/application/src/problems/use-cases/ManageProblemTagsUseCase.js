import { Result, Tag, UniqueEntityID } from '@woodie/domain';
export class ManageProblemTagsUseCase {
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
            if (!['add', 'remove', 'update'].includes(request.operation)) {
                return Result.fail('Invalid operation. Must be add, remove, or update');
            }
            if (!Array.isArray(request.tagNames)) {
                return Result.fail('Tag names must be an array');
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
            // 3. 권한 검증 (소유자만 수정 가능)
            if (!problem.isOwnedBy(request.teacherId)) {
                return Result.fail('Access denied: Only problem owner can manage tags');
            }
            // 4. 작업별 처리
            let operationResult;
            switch (request.operation) {
                case 'add':
                    operationResult = await this.addTags(problem, request.tagNames);
                    break;
                case 'remove':
                    operationResult = await this.removeTags(problem, request.tagNames);
                    break;
                case 'update':
                    operationResult = await this.updateTags(problem, request.tagNames);
                    break;
                default:
                    return Result.fail('Unsupported operation');
            }
            if (operationResult.isFailure) {
                return Result.fail(`Tag operation failed: ${operationResult.errorValue}`);
            }
            // 5. 저장
            const saveResult = await this.problemRepository.save(problem);
            if (saveResult.isFailure) {
                return Result.fail(`Failed to save problem: ${saveResult.errorValue}`);
            }
            // 6. DTO로 변환하여 응답
            const problemDto = this.mapToDto(problem);
            return Result.ok(problemDto);
        }
        catch (error) {
            return Result.fail(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async addTags(problem, tagNames) {
        for (const tagName of tagNames) {
            if (!tagName?.trim())
                continue;
            const tagResult = Tag.create(tagName.trim());
            if (tagResult.isFailure) {
                return Result.fail(`Invalid tag '${tagName}': ${tagResult.errorValue}`);
            }
            const addResult = problem.addTag(tagResult.value);
            if (addResult.isFailure) {
                return Result.fail(`Failed to add tag '${tagName}': ${addResult.errorValue}`);
            }
        }
        return Result.ok();
    }
    async removeTags(problem, tagNames) {
        for (const tagName of tagNames) {
            if (!tagName?.trim())
                continue;
            const removeResult = problem.removeTag(tagName.trim());
            if (removeResult.isFailure) {
                return Result.fail(`Failed to remove tag '${tagName}': ${removeResult.errorValue}`);
            }
        }
        return Result.ok();
    }
    async updateTags(problem, tagNames) {
        const tags = [];
        for (const tagName of tagNames) {
            if (!tagName?.trim())
                continue;
            const tagResult = Tag.create(tagName.trim());
            if (tagResult.isFailure) {
                return Result.fail(`Invalid tag '${tagName}': ${tagResult.errorValue}`);
            }
            tags.push(tagResult.value);
        }
        const updateResult = problem.updateTags(tags);
        if (updateResult.isFailure) {
            return Result.fail(`Failed to update tags: ${updateResult.errorValue}`);
        }
        return Result.ok();
    }
    mapToDto(problem) {
        return {
            id: problem.id.toString(),
            teacherId: problem.teacherId,
            title: problem.content.title,
            description: problem.content.description || '',
            type: problem.type.value,
            difficulty: problem.difficulty.level,
            tags: problem.tags.map(tag => tag.name),
            isActive: problem.isActive,
            createdAt: problem.createdAt.toISOString(),
            updatedAt: problem.updatedAt.toISOString()
        };
    }
}
//# sourceMappingURL=ManageProblemTagsUseCase.js.map