import { Result } from '@woodie/domain';
export class UpdateProfileUseCase {
    profileRepository;
    constructor(profileRepository) {
        this.profileRepository = profileRepository;
    }
    async execute(dto) {
        try {
            // 기존 프로필 조회
            const profileResult = await this.profileRepository.findByUserId(dto.userId);
            if (profileResult.isFailure) {
                return Result.fail(`Failed to find profile: ${profileResult.errorValue}`);
            }
            const profile = profileResult.value;
            if (!profile) {
                return Result.fail('Profile not found');
            }
            // 기본 정보 업데이트 (이름, 학년)
            if (dto.fullName !== undefined || dto.gradeLevel !== undefined) {
                const updateBasicResult = profile.updateProfile(dto.fullName, dto.gradeLevel);
                if (updateBasicResult.isFailure) {
                    return Result.fail(`Failed to update basic info: ${updateBasicResult.errorValue}`);
                }
            }
            // 아바타 URL 업데이트
            if (dto.avatarUrl !== undefined) {
                const updateAvatarResult = profile.updateAvatar(dto.avatarUrl);
                if (updateAvatarResult.isFailure) {
                    return Result.fail(`Failed to update avatar: ${updateAvatarResult.errorValue}`);
                }
            }
            // 설정 업데이트
            if (dto.settings !== undefined) {
                // DTO settings를 Profile entity의 ProfileSettings로 변환
                const profileSettings = {};
                if (dto.settings.theme !== undefined) {
                    profileSettings.theme = dto.settings.theme;
                }
                if (dto.settings.language !== undefined) {
                    profileSettings.language = dto.settings.language;
                }
                if (dto.settings.notifications !== undefined) {
                    profileSettings.notifications = {
                        email: dto.settings.notifications.email ?? true,
                        push: dto.settings.notifications.push ?? true,
                        sms: dto.settings.notifications.sms ?? false
                    };
                }
                if (dto.settings.privacy !== undefined) {
                    profileSettings.privacy = {
                        showEmail: dto.settings.privacy.showEmail ?? false,
                        showActivity: dto.settings.privacy.showActivity ?? true
                    };
                }
                const updateSettingsResult = profile.updateSettings(profileSettings);
                if (updateSettingsResult.isFailure) {
                    return Result.fail(`Failed to update settings: ${updateSettingsResult.errorValue}`);
                }
            }
            // 변경사항을 리포지토리에 저장
            const savedProfileResult = await this.profileRepository.save(profile);
            if (savedProfileResult.isFailure) {
                return Result.fail(`Failed to save profile: ${savedProfileResult.errorValue}`);
            }
            // DTO로 변환 후 반환
            const updatedProfile = savedProfileResult.value;
            const responseDto = this.mapToDto(updatedProfile);
            return Result.ok(responseDto);
        }
        catch (error) {
            return Result.fail(`Unexpected error updating profile: ${error}`);
        }
    }
    // Profile 엔티티를 DTO로 변환하는 헬퍼 메서드
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
//# sourceMappingURL=UpdateProfileUseCase.js.map