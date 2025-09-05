import { Result } from '@woodie/domain';
export class GetProblemListUseCase {
    problemRepository;
    problemSearchService;
    constructor(problemRepository, problemSearchService) {
        this.problemRepository = problemRepository;
        this.problemSearchService = problemSearchService;
    }
    async execute(request) {
        try {
            // 기본값 설정
            const page = Math.max(1, request.page || 1);
            const limit = Math.min(100, Math.max(1, request.limit || 20));
            const offset = (page - 1) * limit;
            // 검색 조건이 있는 경우 검색 서비스 사용
            if (this.hasSearchCriteria(request)) {
                return await this.executeWithSearch(request, page, limit, offset);
            }
            // 일반 조회
            return await this.executeSimpleList(request, page, limit, offset);
        }
        catch (error) {
            return Result.fail(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    hasSearchCriteria(request) {
        return !!(request.searchTerm || request.tags?.length || request.difficultyLevel);
    }
    async executeWithSearch(request, page, limit, offset) {
        const searchCriteria = {
            teacherId: request.teacherId,
            isActive: request.isActive,
            tags: request.tags,
            difficultyLevel: request.difficultyLevel,
            searchTerm: request.searchTerm,
            offset,
            limit
        };
        const searchResult = await this.problemSearchService.searchProblems(searchCriteria);
        if (searchResult.isFailure) {
            return Result.fail(`Search failed: ${searchResult.errorValue}`);
        }
        const { problems, totalCount } = searchResult.value;
        return Result.ok({
            problems: problems.map(p => this.mapToDto(p)),
            totalCount,
            page,
            limit,
            hasNext: offset + limit < totalCount
        });
    }
    async executeSimpleList(request, page, limit, offset) {
        // 조건 객체 생성
        const criteria = {};
        if (request.teacherId)
            criteria.teacherId = request.teacherId;
        if (request.isActive !== undefined)
            criteria.isActive = request.isActive;
        // 목록 조회
        const listResult = await this.problemRepository.findMany(criteria, { offset, limit });
        if (listResult.isFailure) {
            return Result.fail(`Failed to fetch problems: ${listResult.errorValue}`);
        }
        // 총 개수 조회
        const countResult = await this.problemRepository.count(criteria);
        if (countResult.isFailure) {
            return Result.fail(`Failed to count problems: ${countResult.errorValue}`);
        }
        const problems = listResult.value;
        const totalCount = countResult.value;
        return Result.ok({
            problems: problems.map(p => this.mapToDto(p)),
            totalCount,
            page,
            limit,
            hasNext: offset + limit < totalCount
        });
    }
    mapToDto(problem) {
        return {
            id: problem.id.toString(),
            teacherId: problem.teacherId,
            title: problem.content.title,
            description: problem.content.description || '',
            type: problem.type.value,
            difficulty: problem.difficulty.level,
            tags: problem.tags.map((tag) => tag.name),
            isActive: problem.isActive,
            createdAt: problem.createdAt.toISOString(),
            updatedAt: problem.updatedAt.toISOString()
        };
    }
}
//# sourceMappingURL=GetProblemListUseCase.js.map