import { UseCase } from '../../use-cases/UseCase';
import { Result } from '@woodie/domain';
import { Profile, IProfileRepository } from '@woodie/domain';
import { GetProfileDto, ProfileDto } from '../dto/ProfileDto';

export class GetProfileUseCase implements UseCase<GetProfileDto, ProfileDto> {
  constructor(
    private profileRepository: IProfileRepository
  ) {}

  async execute(dto: GetProfileDto): Promise<Result<ProfileDto>> {
    try {
      // 사용자 ID로 프로필 조회
      const profileResult = await this.profileRepository.findByUserId(dto.userId);
      if (profileResult.isFailure) {
        return Result.fail<ProfileDto>(`Failed to find profile: ${profileResult.errorValue}`);
      }

      const profile = profileResult.value;
      if (!profile) {
        return Result.fail<ProfileDto>('Profile not found');
      }

      // DTO로 변환 후 반환
      const responseDto = this.mapToDto(profile);
      return Result.ok<ProfileDto>(responseDto);

    } catch (error) {
      return Result.fail<ProfileDto>(`Unexpected error getting profile: ${error}`);
    }
  }

  // Profile 엔티티를 DTO로 변환하는 헬퍼 메서드 (CreateProfileUseCase와 동일)
  private mapToDto(profile: Profile): ProfileDto {
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