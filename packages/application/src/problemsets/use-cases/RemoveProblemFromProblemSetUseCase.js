import { BaseUseCase } from '../../use-cases/UseCase';
import { Result, UniqueEntityID } from '@woodie/domain';
/**
 * 문제집에서 문제 제거 UseCase
 *
 * 비즈니스 규칙:
 * - 문제집 소유자(교사)만 문제 제거 가능
 * - 관리자는 모든 문제집에서 문제 제거 가능
 * - 문제집에 포함되지 않은 문제는 제거 불가
 * - 문제 제거 후 나머지 문제들의 순서 자동 재정렬
 * - 최소 1개 문제는 유지해야 함 (선택사항)
 */
export class RemoveProblemFromProblemSetUseCase extends BaseUseCase {
    problemSetRepository;
    userRepository;
    constructor(problemSetRepository, userRepository) {
        super();
        this.problemSetRepository = problemSetRepository;
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
            // 4. 문제 포함 여부 확인
            const problemId = new UniqueEntityID(request.problemId);
            if (!problemSet.containsProblem(problemId)) {
                return Result.fail('Problem is not included in this problem set');
            }
            // 5. 제거 전 상태 확인
            const preRemovalCheckResult = this.checkPreRemovalConditions(problemSet, request.problemId);
            if (preRemovalCheckResult.isFailure) {
                return Result.fail(preRemovalCheckResult.error);
            }
            // 6. 제거될 아이템 정보 저장 (응답용)
            const removedItemResult = this.findItemToRemove(problemSet, request.problemId);
            if (removedItemResult.isFailure) {
                return Result.fail(removedItemResult.error);
            }
            const removedItem = removedItemResult.value;
            // 7. 문제 제거
            const removeResult = problemSet.removeProblem(problemId);
            if (removeResult.isFailure) {
                return Result.fail(`Failed to remove problem: ${removeResult.error}`);
            }
            // 8. 저장
            const saveResult = await this.problemSetRepository.save(problemSet);
            if (saveResult.isFailure) {
                return Result.fail(`Failed to save problem set: ${saveResult.error}`);
            }
            // 9. 응답 생성
            const problemSetDto = await this.mapToDetailedDto(problemSet);
            const response = {
                problemSet: problemSetDto,
                removedItem
            };
            return Result.ok(response);
        }
        catch (error) {
            return Result.fail(`Unexpected error removing problem from problem set: ${error}`);
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
    checkPreRemovalConditions(problemSet, problemId) {
        // 최소 문제 수 확인 (선택적 정책)
        if (problemSet.itemCount <= 1) {
            return Result.fail('Cannot remove problem: Problem set must contain at least one problem');
        }
        // TODO: 추가적인 비즈니스 규칙 검증
        // - 활성 과제에서 사용 중인지 확인
        // - 학생들이 이미 풀고 있는 문제인지 확인
        // - 통계 데이터에 영향을 주는지 확인
        return Result.ok();
    }
    findItemToRemove(problemSet, problemId) {
        try {
            const items = problemSet.getOrderedItems();
            const itemToRemove = items.find((item) => item.problemId.toString() === problemId);
            if (!itemToRemove) {
                return Result.fail('Could not find item to remove in problem set');
            }
            const itemDto = {
                id: itemToRemove.id.toString(),
                problemId: itemToRemove.problemId.toString(),
                orderIndex: itemToRemove.orderIndex,
                points: 10, // TODO: 실제 포인트 값
                settings: {} // TODO: 실제 설정 값
            };
            return Result.ok(itemDto);
        }
        catch (error) {
            return Result.fail(`Failed to find item to remove: ${error}`);
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
        return items.reduce((total, item) => total + (item.estimatedTimeMinutes || 3), 0); // 문제당 3분
    }
    // 추가적인 유틸리티 메서드들
    async checkActiveAssignmentUsage(problemSetId, problemId) {
        const warnings = [];
        // TODO: 활성 과제에서 해당 문제가 사용되고 있는지 확인
        // - 진행 중인 과제가 있는지 확인
        // - 학생들이 이미 답안을 제출했는지 확인
        // - 통계 데이터에 영향을 주는지 확인
        return Result.ok(warnings);
    }
    async archiveRemovedItemData(problemSetId, problemId) {
        // TODO: 제거된 문제와 관련된 데이터 아카이브
        // - 학습 기록 아카이브
        // - 통계 데이터 업데이트
        // - 진도 데이터 재계산
        return Result.ok();
    }
    validateRemovalImpact(problemSet, problemId) {
        const warnings = [];
        let canRemove = true;
        // 문제집이 비어있게 되는 경우
        if (problemSet.itemCount <= 1) {
            warnings.push('This will leave the problem set empty');
            canRemove = false;
        }
        // 순서상 중요한 위치의 문제인 경우
        const problemPosition = problemSet.getProblemPosition(new UniqueEntityID(problemId));
        if (problemPosition === 0) {
            warnings.push('This is the first problem in the set - students may be confused');
        }
        // TODO: 추가적인 영향도 분석
        // - 난이도 분포 변화
        // - 주제별 균형 변화
        // - 예상 소요 시간 변화
        return Result.ok({ canRemove, warnings });
    }
}
//# sourceMappingURL=RemoveProblemFromProblemSetUseCase.js.map