import { Result } from '@woodie/domain';
export class FindProfilesByRoleUseCase {
    profileRepository;
    constructor(profileRepository) {
        this.profileRepository = profileRepository;
    }
    async execute(dto) {
        try {
            const { role } = dto;
            if (!role || !['student', 'teacher', 'admin'].includes(role)) {
                return Result.fail('Invalid role. Must be student, teacher, or admin');
            }
            // 역할별 프로필 조회
            const profilesResult = await this.profileRepository.findByRole(role);
            if (profilesResult.isFailure) {
                return Result.fail(profilesResult.errorValue);
            }
            return Result.ok(profilesResult.value);
        }
        catch (error) {
            console.error('Find profiles by role error:', error);
            return Result.fail('Failed to find profiles by role');
        }
    }
}
//# sourceMappingURL=FindProfilesByRoleUseCase.js.map