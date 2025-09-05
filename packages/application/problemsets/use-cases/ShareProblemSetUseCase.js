import { BaseUseCase } from '../../use-cases/UseCase';
import { Result, UniqueEntityID } from '@woodie/domain';
export class ShareProblemSetUseCase extends BaseUseCase {
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
            // 2. 문제집 조회
            const problemSetResult = await this.problemSetRepository.findById(new UniqueEntityID(request.problemSetId));
            if (problemSetResult.isFailure) {
                return Result.fail('Problem set not found');
            }
            const problemSet = problemSetResult.value;
            // 3. 소유권 확인
            if (problemSet.teacherId !== request.requesterId) {
                return Result.fail('Only the owner can change sharing settings');
            }
            // 4. 공유 설정 업데이트
            const currentIsShared = problemSet.isShared;
            const currentIsPublic = problemSet.isPublic;
            // isPublic은 요청에서 제공되지 않으면 현재 값 유지
            const newIsPublic = request.isPublic !== undefined ? request.isPublic : currentIsPublic;
            // 도메인 엔티티의 공유 설정 업데이트
            problemSet.updateSharingSettings(request.isShared, newIsPublic);
            // 5. 변경사항 저장
            const saveResult = await this.problemSetRepository.save(problemSet);
            if (saveResult.isFailure) {
                return Result.fail(`Failed to update sharing settings: ${saveResult.error}`);
            }
            // 6. 응답 메시지 생성
            let message;
            if (request.isShared && !currentIsShared) {
                message = newIsPublic
                    ? 'Problem set is now shared with teachers and visible to students'
                    : 'Problem set is now shared with other teachers';
            }
            else if (!request.isShared && currentIsShared) {
                message = 'Problem set sharing has been disabled';
            }
            else if (request.isShared && newIsPublic !== currentIsPublic) {
                message = newIsPublic
                    ? 'Problem set is now also visible to students'
                    : 'Problem set visibility to students has been removed';
            }
            else {
                message = 'Sharing settings updated';
            }
            // 7. 응답 생성
            const response = {
                problemSetId: problemSet.id.toString(),
                title: problemSet.title.value,
                isShared: problemSet.isShared,
                isPublic: problemSet.isPublic,
                sharedAt: problemSet.isShared ? new Date() : undefined,
                message
            };
            return Result.ok(response);
        }
        catch (error) {
            return Result.fail(`Unexpected error updating sharing settings: ${error}`);
        }
    }
    validateRequest(request) {
        const errors = [];
        if (!request.problemSetId || request.problemSetId.trim().length === 0) {
            errors.push('Problem set ID is required');
        }
        if (!request.requesterId || request.requesterId.trim().length === 0) {
            errors.push('Requester ID is required');
        }
        if (typeof request.isShared !== 'boolean') {
            errors.push('isShared must be a boolean value');
        }
        if (request.isPublic !== undefined && typeof request.isPublic !== 'boolean') {
            errors.push('isPublic must be a boolean value when provided');
        }
        if (errors.length > 0) {
            return Result.fail(errors.join(', '));
        }
        return Result.ok();
    }
}
//# sourceMappingURL=ShareProblemSetUseCase.js.map