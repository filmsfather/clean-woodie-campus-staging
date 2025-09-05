import { BaseUseCase } from '../../use-cases/UseCase';
import { Result, ProblemSet, ProblemSetTitle, ProblemSetDescription, UniqueEntityID } from '@woodie/domain';
export class CloneProblemSetUseCase extends BaseUseCase {
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
            // 2. 원본 문제집 조회
            const sourceProblemSetResult = await this.problemSetRepository.findById(new UniqueEntityID(request.sourceProblemSetId));
            if (sourceProblemSetResult.isFailure) {
                return Result.fail('Source problem set not found');
            }
            const sourceProblemSet = sourceProblemSetResult.value;
            // 3. 복제 권한 확인
            const canClone = this.canCloneProblemSet(sourceProblemSet, request.targetTeacherId);
            if (!canClone) {
                return Result.fail('Cannot clone this problem set. Only shared problem sets or your own problem sets can be cloned.');
            }
            // 4. 새 제목 생성 (중복 확인 포함)
            const newTitleResult = await this.generateUniqueTitle(request.newTitle || `Copy of ${sourceProblemSet.title.value}`, request.targetTeacherId);
            if (newTitleResult.isFailure) {
                return Result.fail(newTitleResult.error);
            }
            // 5. 도메인 Value Objects 생성
            const titleResult = ProblemSetTitle.create(newTitleResult.value);
            if (titleResult.isFailure) {
                return Result.fail(`Invalid title: ${titleResult.error}`);
            }
            let descriptionVo;
            const descriptionText = request.newDescription || sourceProblemSet.description?.value;
            if (descriptionText) {
                const descriptionResult = ProblemSetDescription.create(descriptionText);
                if (descriptionResult.isFailure) {
                    return Result.fail(`Invalid description: ${descriptionResult.error}`);
                }
                descriptionVo = descriptionResult.value;
            }
            // 6. 복제본의 공유/공개 설정 결정
            let isPublic;
            let isShared;
            if (request.preserveSettings) {
                isPublic = sourceProblemSet.isPublic;
                isShared = sourceProblemSet.isShared;
            }
            else {
                isPublic = request.isPublic ?? false;
                isShared = request.isShared ?? false;
            }
            // 7. 새 문제집 도메인 엔티티 생성
            const clonedProblemSetResult = ProblemSet.create({
                teacherId: request.targetTeacherId,
                title: titleResult.value,
                description: descriptionVo,
                isPublic,
                isShared
            });
            if (clonedProblemSetResult.isFailure) {
                return Result.fail(`Failed to create cloned problem set: ${clonedProblemSetResult.error}`);
            }
            const clonedProblemSet = clonedProblemSetResult.value;
            // 8. 원본의 모든 아이템 복사
            const sourceItems = sourceProblemSet.getOrderedItems();
            let copiedItemsCount = 0;
            for (const sourceItem of sourceItems) {
                const addResult = clonedProblemSet.addProblem(sourceItem.problemId, sourceItem.orderIndex);
                if (addResult.isSuccess) {
                    copiedItemsCount++;
                }
                // 실패한 아이템이 있어도 계속 진행 (일부 문제가 삭제되었을 수도 있음)
            }
            // 9. 복제된 문제집 저장
            const saveResult = await this.problemSetRepository.save(clonedProblemSet);
            if (saveResult.isFailure) {
                return Result.fail(`Failed to save cloned problem set: ${saveResult.error}`);
            }
            // 10. 응답 생성
            const response = {
                clonedProblemSet: {
                    id: clonedProblemSet.id.toString(),
                    title: clonedProblemSet.title.value,
                    description: clonedProblemSet.description?.value,
                    teacherId: clonedProblemSet.teacherId,
                    itemCount: clonedProblemSet.itemCount,
                    isPublic: clonedProblemSet.isPublic,
                    isShared: clonedProblemSet.isShared,
                    createdAt: clonedProblemSet.createdAt
                },
                originalProblemSet: {
                    id: sourceProblemSet.id.toString(),
                    title: sourceProblemSet.title.value,
                    teacherId: sourceProblemSet.teacherId
                    // teacherName은 실제로는 다른 서비스에서 조회해야 함
                },
                cloneDetails: {
                    itemsCopied: copiedItemsCount,
                    settingsCopied: request.preserveSettings ?? false,
                    totalPoints: this.calculateTotalPoints(clonedProblemSet),
                    estimatedTimeMinutes: this.calculateEstimatedTime(clonedProblemSet)
                }
            };
            return Result.ok(response);
        }
        catch (error) {
            return Result.fail(`Unexpected error cloning problem set: ${error}`);
        }
    }
    validateRequest(request) {
        const errors = [];
        if (!request.sourceProblemSetId || request.sourceProblemSetId.trim().length === 0) {
            errors.push('Source problem set ID is required');
        }
        if (!request.targetTeacherId || request.targetTeacherId.trim().length === 0) {
            errors.push('Target teacher ID is required');
        }
        if (request.newTitle && request.newTitle.length > 255) {
            errors.push('New title must be 255 characters or less');
        }
        if (request.newDescription && request.newDescription.length > 1000) {
            errors.push('New description must be 1000 characters or less');
        }
        if (errors.length > 0) {
            return Result.fail(errors.join(', '));
        }
        return Result.ok();
    }
    canCloneProblemSet(problemSet, requesterId) {
        // 소유자는 항상 복제 가능
        if (problemSet.teacherId === requesterId) {
            return true;
        }
        // 공유된 문제집만 다른 사람이 복제 가능
        return problemSet.isShared;
    }
    async generateUniqueTitle(baseTitle, teacherId) {
        let title = baseTitle;
        let counter = 1;
        while (counter <= 10) { // 무한루프 방지
            const existsResult = await this.problemSetRepository.findByTeacherIdAndTitle(teacherId, title);
            if (existsResult.isFailure) {
                // 제목이 중복되지 않음
                return Result.ok(title);
            }
            // 중복되므로 번호를 붙여서 재시도
            title = `${baseTitle} (${counter})`;
            counter++;
        }
        return Result.fail('Could not generate a unique title after 10 attempts');
    }
    calculateTotalPoints(problemSet) {
        const items = problemSet.getOrderedItems();
        return items.reduce((total, item) => total + (item.points || 10), 0);
    }
    calculateEstimatedTime(problemSet) {
        const items = problemSet.getOrderedItems();
        return items.reduce((totalMinutes, item) => totalMinutes + (item.estimatedTimeMinutes || 3), 0);
    }
}
//# sourceMappingURL=CloneProblemSetUseCase.js.map