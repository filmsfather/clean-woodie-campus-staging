import { Result, AnswerContent, UniqueEntityID } from '@woodie/domain';
export class UpdateProblemAnswerUseCase {
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
            if (!request.correctAnswerValue?.trim()) {
                return Result.fail('Correct answer value is required');
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
                return Result.fail('Access denied: Only problem owner can update answer');
            }
            // 4. 새로운 답안 내용 생성
            const newAnswerResult = AnswerContent.create({
                type: problem.type.value,
                acceptedAnswers: [request.correctAnswerValue.trim()],
                points: 1
            });
            if (newAnswerResult.isFailure) {
                return Result.fail(`Invalid answer: ${newAnswerResult.errorValue}`);
            }
            // 5. 도메인 로직 실행
            const updateResult = problem.updateCorrectAnswer(newAnswerResult.value);
            if (updateResult.isFailure) {
                return Result.fail(`Failed to update answer: ${updateResult.errorValue}`);
            }
            // 6. 저장
            const saveResult = await this.problemRepository.save(problem);
            if (saveResult.isFailure) {
                return Result.fail(`Failed to save problem: ${saveResult.errorValue}`);
            }
            // 7. DTO로 변환하여 응답
            const problemDto = this.mapToDto(problem);
            return Result.ok(problemDto);
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
//# sourceMappingURL=UpdateProblemAnswerUseCase.js.map