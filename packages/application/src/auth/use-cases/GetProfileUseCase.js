import { Result } from '@woodie/domain';
export class GetProfileUseCase {
    profileRepository;
    constructor(profileRepository) {
        this.profileRepository = profileRepository;
    }
    async execute(dto) {
        try {
            // 사용자 ID로 프로필 조회
            const profileResult = await this.profileRepository.findByUserId(dto.userId);
            if (profileResult.isFailure) {
                return Result.fail(`Failed to find profile: ${profileResult.errorValue}`);
            }
            const profile = profileResult.value;
            if (!profile) {
                return Result.fail('Profile not found');
            }
            // DTO로 변환 후 반환
            const responseDto = this.mapToDto(profile);
            return Result.ok(responseDto);
        }
        catch (error) {
            return Result.fail(`Unexpected error getting profile: ${error}`);
        }
    }
    // Profile 엔티티를 DTO로 변환하는 헬퍼 메서드 (CreateProfileUseCase와 동일)
    mapToDto(profile) {
        const displayInfo = profile.getDisplayInfo();
        return {
            id: profile.id.toString(),
            email: profile.email.value,
            fullName: profile.fullName.value,
            displayName: displayInfo.name,
            initials: displayInfo.initials,
            role: profile.role,
            schoolId: profile.schoolId,
            gradeLevel: profile.gradeLevel,
            avatarUrl: profile.avatarUrl,
            hasAvatar: displayInfo.hasAvatar,
            settings: {
                theme: profile.settings.theme || 'auto',
                language: profile.settings.language || 'ko',
                notifications: {
                    email: profile.settings.notifications?.email ?? true,
                    push: profile.settings.notifications?.push ?? true,
                    sms: profile.settings.notifications?.sms ?? false
                },
                privacy: {
                    showEmail: profile.settings.privacy?.showEmail ?? false,
                    showActivity: profile.settings.privacy?.showActivity ?? true
                }
            },
            createdAt: profile.createdAt.toISOString(),
            updatedAt: profile.updatedAt.toISOString()
        };
    }
}
//# sourceMappingURL=GetProfileUseCase.js.map