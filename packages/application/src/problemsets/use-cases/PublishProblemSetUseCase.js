import { BaseUseCase } from '../../use-cases/UseCase';
import { Result, UniqueEntityID } from '@woodie/domain';
export class PublishProblemSetUseCase extends BaseUseCase {
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
                return Result.fail('Only the owner can change publish settings');
            }
            // 4. 공개 가능성 검증
            const warnings = [];
            if (request.isPublic) {
                // 빈 문제집은 공개할 수 없음
                if (problemSet.itemCount === 0) {
                    return Result.fail('Cannot publish an empty problem set. Please add at least one problem.');
                }
                // 제목이나 설명이 부적절할 수 있는 경우 경고
                if (!problemSet.description || problemSet.description.value.trim().length < 20) {
                    warnings.push('Consider adding a detailed description for better discoverability');
                }
                // 문제 수가 너무 적은 경우 경고
                if (problemSet.itemCount < 3) {
                    warnings.push('Problem sets with fewer than 3 problems may not provide sufficient practice');
                }
            }
            // 5. 공개 설정 업데이트
            const wasPublic = problemSet.isPublic;
            const wasShared = problemSet.isShared;
            if (request.isPublic) {
                // 공개 시 자동으로 공유도 활성화
                problemSet.updateSharingSettings(true, true);
                // 공개 메모가 있다면 설정 (도메인 엔티티에 publishNote 필드가 있다고 가정)
                if (request.publishNote) {
                    // problemSet.setPublishNote(request.publishNote)
                }
            }
            else {
                // 공개 해제 (공유 설정은 유지)
                problemSet.updateSharingSettings(wasShared, false);
            }
            // 6. 변경사항 저장
            const saveResult = await this.problemSetRepository.save(problemSet);
            if (saveResult.isFailure) {
                return Result.fail(`Failed to update publish settings: ${saveResult.error}`);
            }
            // 7. 응답 메시지 생성
            let message;
            const now = new Date();
            if (request.isPublic && !wasPublic) {
                message = 'Problem set has been published and is now visible to students';
            }
            else if (!request.isPublic && wasPublic) {
                message = 'Problem set has been unpublished and is no longer visible to students';
            }
            else if (request.isPublic) {
                message = 'Problem set publish settings updated';
            }
            else {
                message = 'Problem set remains private';
            }
            // 8. 응답 생성
            const response = {
                problemSetId: problemSet.id.toString(),
                title: problemSet.title.value,
                isPublic: problemSet.isPublic,
                isShared: problemSet.isShared,
                publishedAt: problemSet.isPublic && !wasPublic ? now : undefined,
                unpublishedAt: !problemSet.isPublic && wasPublic ? now : undefined,
                message,
                ...(warnings.length > 0 && { warnings })
            };
            return Result.ok(response);
        }
        catch (error) {
            return Result.fail(`Unexpected error updating publish settings: ${error}`);
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
        if (typeof request.isPublic !== 'boolean') {
            errors.push('isPublic must be a boolean value');
        }
        if (request.publishNote && request.publishNote.length > 500) {
            errors.push('Publish note must be 500 characters or less');
        }
        if (errors.length > 0) {
            return Result.fail(errors.join(', '));
        }
        return Result.ok();
    }
}
//# sourceMappingURL=PublishProblemSetUseCase.js.map