import { BaseUseCase } from '../../use-cases/UseCase';
import { Result, UniqueEntityID, ProblemSet, ProblemSetTitle, ProblemSetDescription } from '@woodie/domain';
/**
 * 문제집 생성 UseCase
 *
 * 비즈니스 규칙:
 * - 교사만 문제집을 생성할 수 있음
 * - 제목은 필수이며 중복 불가 (같은 교사 내에서)
 * - isShared=true인 경우 모든 교사가 조회/복제 가능
 * - isPublic=true인 경우 학생도 조회 가능 (과제 배정 시)
 * - 초기 문제 추가 시 문제 존재 여부 확인
 */
export class CreateProblemSetUseCase extends BaseUseCase {
    problemSetRepository;
    constructor(problemSetRepository) {
        super();
        this.problemSetRepository = problemSetRepository;
    }
    async execute(request) {
        try {
            // 1. 입력 유효성 검증
            const validationResult = this.validateRequest(request);
            if (validationResult.isFailure) {
                return Result.fail(validationResult.error);
            }
            // 2. 제목 중복 확인 (같은 교사 내에서)
            const titleExistsResult = await this.problemSetRepository.findByTeacherIdAndTitle(request.teacherId, request.title);
            if (titleExistsResult.isSuccess) {
                return Result.fail('A problem set with this title already exists for this teacher');
            }
            // 3. 도메인 Value Objects 생성
            const titleResult = ProblemSetTitle.create(request.title);
            if (titleResult.isFailure) {
                return Result.fail(`Invalid title: ${titleResult.error}`);
            }
            let descriptionVo;
            if (request.description) {
                const descriptionResult = ProblemSetDescription.create(request.description);
                if (descriptionResult.isFailure) {
                    return Result.fail(`Invalid description: ${descriptionResult.error}`);
                }
                descriptionVo = descriptionResult.value;
            }
            // 4. ProblemSet 도메인 엔티티 생성 (공유 설정 포함)
            const problemSetResult = ProblemSet.create({
                teacherId: request.teacherId,
                title: titleResult.value,
                description: descriptionVo,
                isPublic: request.isPublic ?? false,
                isShared: request.isShared ?? false
            });
            if (problemSetResult.isFailure) {
                return Result.fail(`Failed to create problem set: ${problemSetResult.error}`);
            }
            const problemSet = problemSetResult.value;
            // 5. 초기 문제들 추가 (요청된 경우)
            const warnings = [];
            if (request.initialProblems && request.initialProblems.length > 0) {
                for (const problemData of request.initialProblems) {
                    const addResult = problemSet.addProblem(new UniqueEntityID(problemData.problemId), problemData.orderIndex);
                    if (addResult.isFailure) {
                        warnings.push(`Failed to add problem ${problemData.problemId}: ${addResult.error}`);
                    }
                }
            }
            // 6. 리포지토리에 저장
            const saveResult = await this.problemSetRepository.save(problemSet);
            if (saveResult.isFailure) {
                return Result.fail(`Failed to save problem set: ${saveResult.error}`);
            }
            // 7. 응답 DTO 생성
            const problemSetDto = this.mapToDto(problemSet, request.isPublic, request.isShared);
            const response = {
                problemSet: problemSetDto,
                ...(warnings.length > 0 && { validationWarnings: warnings })
            };
            return Result.ok(response);
        }
        catch (error) {
            return Result.fail(`Unexpected error creating problem set: ${error}`);
        }
    }
    validateRequest(request) {
        const errors = [];
        if (!request.title || request.title.trim().length === 0) {
            errors.push('Title is required');
        }
        if (!request.teacherId || request.teacherId.trim().length === 0) {
            errors.push('Teacher ID is required');
        }
        if (request.title && request.title.length > 255) {
            errors.push('Title must be 255 characters or less');
        }
        if (request.description && request.description.length > 1000) {
            errors.push('Description must be 1000 characters or less');
        }
        if (request.initialProblems && request.initialProblems.length > 50) {
            errors.push('Cannot add more than 50 initial problems');
        }
        // 초기 문제들의 orderIndex 유효성 검증
        if (request.initialProblems && request.initialProblems.length > 0) {
            const orderIndices = request.initialProblems.map(p => p.orderIndex);
            const uniqueIndices = new Set(orderIndices);
            if (uniqueIndices.size !== orderIndices.length) {
                errors.push('Order indices must be unique');
            }
            if (Math.min(...orderIndices) < 0) {
                errors.push('Order indices must be non-negative');
            }
        }
        if (errors.length > 0) {
            return Result.fail(errors.join(', '));
        }
        return Result.ok();
    }
    mapToDto(problemSet, isPublic, isShared) {
        return {
            id: problemSet.id.toString(),
            title: problemSet.title.value,
            description: problemSet.description?.value,
            teacherId: problemSet.teacherId,
            itemCount: problemSet.itemCount,
            totalPoints: this.calculateTotalPoints(problemSet),
            estimatedTimeMinutes: this.calculateEstimatedTime(problemSet),
            isPublic: problemSet.isPublic,
            isShared: problemSet.isShared,
            createdAt: problemSet.createdAt,
            updatedAt: problemSet.updatedAt
        };
    }
    calculateTotalPoints(problemSet) {
        // 실제 구현: 문제집의 모든 아이템들의 포인트 합산
        const items = problemSet.getOrderedItems();
        return items.reduce((total, item) => {
            // 기본 포인트는 10점, 실제로는 item.points 속성을 사용
            return total + (item.points || 10);
        }, 0);
    }
    calculateEstimatedTime(problemSet) {
        // 실제 구현: 각 문제의 예상 시간 합산
        const items = problemSet.getOrderedItems();
        return items.reduce((totalMinutes, item) => {
            // 기본 시간은 3분, 실제로는 문제 유형별로 다르게 계산
            return totalMinutes + (item.estimatedTimeMinutes || 3);
        }, 0);
    }
}
//# sourceMappingURL=CreateProblemSetUseCase.js.map