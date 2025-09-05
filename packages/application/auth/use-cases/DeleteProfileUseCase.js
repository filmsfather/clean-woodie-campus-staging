import { UniqueEntityID, Result } from '@woodie/domain';
export class DeleteProfileUseCase {
    profileRepository;
    constructor(profileRepository) {
        this.profileRepository = profileRepository;
    }
    async execute(dto) {
        try {
            const { userId, requesterId } = dto;
            // 프로필 존재 여부 확인
            const profileResult = await this.profileRepository.findById(new UniqueEntityID(userId));
            if (profileResult.isFailure) {
                return Result.fail('Failed to check profile existence');
            }
            if (!profileResult.value) {
                return Result.fail('Profile not found');
            }
            // 권한 확인 (본인 또는 관리자만 삭제 가능)
            if (requesterId && requesterId !== userId) {
                const requesterResult = await this.profileRepository.findById(new UniqueEntityID(requesterId));
                if (requesterResult.isFailure || !requesterResult.value) {
                    return Result.fail('Requester not found');
                }
                if (requesterResult.value.role !== 'admin') {
                    return Result.fail('Only admins can delete other profiles');
                }
            }
            // 프로필 삭제
            const deleteResult = await this.profileRepository.delete(new UniqueEntityID(userId));
            if (deleteResult.isFailure) {
                return Result.fail(deleteResult.errorValue);
            }
            return Result.ok();
        }
        catch (error) {
            console.error('Delete profile error:', error);
            return Result.fail('Failed to delete profile');
        }
    }
}
//# sourceMappingURL=DeleteProfileUseCase.js.map