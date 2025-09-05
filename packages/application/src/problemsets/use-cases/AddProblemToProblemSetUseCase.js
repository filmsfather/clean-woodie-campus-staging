import { BaseUseCase } from '../../use-cases/UseCase';
import { Result, UniqueEntityID } from '@woodie/domain';
/**
 * 문제집에 문제 추가 UseCase
 *
 * 비즈니스 규칙:
 * - 문제집 소유자(교사)만 문제 추가 가능
 * - 관리자는 모든 문제집에 문제 추가 가능
 * - 추가하려는 문제가 존재해야 함
 * - 이미 문제집에 포함된 문제는 중복 추가 불가
 * - 문제집당 최대 50개 문제 제한
 * - orderIndex 자동 할당 또는 수동 지정 가능
 */
export class AddProblemToProblemSetUseCase extends BaseUseCase {
    problemSetRepository;
    problemRepository;
    userRepository;
    constructor(problemSetRepository, problemRepository, userRepository) {
        super();
        this.problemSetRepository = problemSetRepository;
        this.problemRepository = problemRepository;
        this.userRepository = userRepository;
    }
    async execute(request) {
        try {
            // 1. 입력 유효성 검증
            const validationResult = this.validateRequest(request);
            if (validationResult.isFailure) {
                return Result.fail(validationResult.error);
            }
            // 2. 문제집 조회
            const problemSetResult = await this.problemSetRepository.findById(new UniqueEntityID(request.problemSetId));
            if (problemSetResult.isFailure) {
                return Result.fail('Problem set not found');
            }
            const problemSet = problemSetResult.value;
            // 3. 소유권 확인
            const ownershipResult = await this.checkOwnership(request, problemSet);
            if (ownershipResult.isFailure) {
                return Result.fail(ownershipResult.error);
            }
            // 4. 문제 존재 여부 확인
            const problemExistsResult = await this.problemRepository.exists(new UniqueEntityID(request.problemId));
            if (problemExistsResult.isFailure || !problemExistsResult.value) {
                return Result.fail('Problem not found');
            }
            // 5. 중복 확인
            if (problemSet.containsProblem(new UniqueEntityID(request.problemId))) {
                return Result.fail('Problem is already included in this problem set');
            }
            // 6. 문제집 크기 제한 확인
            if (!problemSet.canAddMoreProblems()) {
                return Result.fail('Cannot add more problems: Problem set has reached maximum capacity (50 problems)');
            }
            // 7. 문제 추가
            const addResult = problemSet.addProblem(new UniqueEntityID(request.problemId), request.orderIndex);
            if (addResult.isFailure) {
                return Result.fail(`Failed to add problem: ${addResult.error}`);
            }
            // 8. 저장
            const saveResult = await this.problemSetRepository.save(problemSet);
            if (saveResult.isFailure) {
                return Result.fail(`Failed to save problem set: ${saveResult.error}`);
            }
            // 9. 추가된 아이템 정보 조회
            const addedItemResult = this.findAddedItem(problemSet, request.problemId);
            if (addedItemResult.isFailure) {
                return Result.fail(addedItemResult.error);
            }
            const addedItem = addedItemResult.value;
            // 10. 응답 생성
            const problemSetDto = await this.mapToDetailedDto(problemSet);
            const response = {
                problemSet: problemSetDto,
                addedItem
            };
            return Result.ok(response);
        }
        catch (error) {
            return Result.fail(`Unexpected error adding problem to problem set: ${error}`);
        }
    }
    validateRequest(request) {
        const errors = [];
        if (!request.problemSetId || request.problemSetId.trim().length === 0) {
            errors.push('Problem set ID is required');
        }
        if (!request.problemId || request.problemId.trim().length === 0) {
            errors.push('Problem ID is required');
        }
        if (!request.requesterId || request.requesterId.trim().length === 0) {
            errors.push('Requester ID is required');
        }
        // orderIndex 검증 (선택적)
        if (request.orderIndex !== undefined) {
            if (typeof request.orderIndex !== 'number' || request.orderIndex < 0) {
                errors.push('Order index must be a non-negative number');
            }
            if (request.orderIndex > 1000) {
                errors.push('Order index cannot exceed 1000');
            }
        }
        // points 검증 (선택적)
        if (request.points !== undefined) {
            if (typeof request.points !== 'number' || request.points < 1) {
                errors.push('Points must be a positive number');
            }
            if (request.points > 100) {
                errors.push('Points cannot exceed 100');
            }
        }
        if (errors.length > 0) {
            return Result.fail(errors.join(', '));
        }
        return Result.ok();
    }
    async checkOwnership(request, problemSet) {
        // 소유자 확인
        if (problemSet.isOwnedBy(request.requesterId)) {
            return Result.ok();
        }
        // 관리자 권한 확인
        const user = await this.userRepository.findById(new UniqueEntityID(request.requesterId));
        if (user && user.role === 'admin') {
            return Result.ok();
        }
        return Result.fail('Access denied: You can only modify your own problem sets');
    }
    findAddedItem(problemSet, problemId) {
        try {
            const items = problemSet.getOrderedItems();
            const addedItem = items.find((item) => item.problemId.toString() === problemId);
            if (!addedItem) {
                return Result.fail('Could not find added item in problem set');
            }
            const itemDto = {
                id: addedItem.id.toString(),
                problemId: addedItem.problemId.toString(),
                orderIndex: addedItem.orderIndex,
                points: 10, // TODO: 실제 포인트 값 또는 request.points 사용
                settings: {} // TODO: 실제 설정 값
            };
            return Result.ok(itemDto);
        }
        catch (error) {
            return Result.fail(`Failed to find added item: ${error}`);
        }
    }
    async mapToDetailedDto(problemSet) {
        const items = problemSet.getOrderedItems();
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
            updatedAt: problemSet.updatedAt,
            items: items.map((item) => ({
                id: item.id.toString(),
                problemId: item.problemId.toString(),
                orderIndex: item.orderIndex,
                points: 10, // TODO: 실제 포인트 값
                settings: {} // TODO: 실제 설정 값
            }))
        };
    }
    calculateTotalPoints(problemSet) {
        const items = problemSet.getOrderedItems();
        return items.reduce((total, item) => total + (item.points || 10), 0);
    }
    calculateEstimatedTime(problemSet) {
        const items = problemSet.getOrderedItems();
        return items.reduce((total, item) => total + (item.estimatedTimeMinutes || 3), 0);
    }
    // 추가적인 유틸리티 메서드들
    async validateProblemCompatibility(problemId, problemSetId) {
        // TODO: 문제와 문제집 간의 호환성 검증
        // - 문제 유형이 문제집에 적합한지
        // - 난이도 수준이 맞는지
        // - 태그가 관련이 있는지
        return Result.ok();
    }
    async enrichAddedItemWithProblemDetails(item) {
        // TODO: 문제 상세 정보로 아이템 정보 보완
        // - 문제 제목
        // - 문제 유형
        // - 예상 소요 시간
        // - 기본 배점
        try {
            const problemResult = await this.problemRepository.findById(new UniqueEntityID(item.problemId));
            if (problemResult.isSuccess) {
                const problem = problemResult.value;
                return {
                    ...item,
                    problemTitle: problem.content?.title || 'Untitled Problem',
                    problemType: problem.type?.value || 'unknown'
                };
            }
            return item;
        }
        catch (error) {
            // 에러가 발생해도 기본 아이템은 반환
            return item;
        }
    }
}
//# sourceMappingURL=AddProblemToProblemSetUseCase.js.map