import { Result } from '@woodie/domain';
export class CheckUserExistsUseCase {
    profileRepository;
    constructor(profileRepository) {
        this.profileRepository = profileRepository;
    }
    async execute(dto) {
        try {
            const { userId } = dto;
            if (!userId || userId.trim().length === 0) {
                return Result.fail('User ID is required');
            }
            // 사용자 존재 확인
            const existsResult = await this.profileRepository.existsByUserId(userId);
            if (existsResult.isFailure) {
                return Result.fail(existsResult.errorValue);
            }
            return Result.ok(existsResult.value);
        }
        catch (error) {
            console.error('Check user exists error:', error);
            return Result.fail('Failed to check user existence');
        }
    }
}
//# sourceMappingURL=CheckUserExistsUseCase.js.map