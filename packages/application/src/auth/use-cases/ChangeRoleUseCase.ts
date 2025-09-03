import { UseCase } from '../../use-cases/UseCase';
import { Result, Profile, IProfileRepository } from '@woodie/domain';
import { ChangeRoleDto, ProfileDto } from '../dto/ProfileDto';

export class ChangeRoleUseCase implements UseCase<ChangeRoleDto, ProfileDto> {
  constructor(
    private profileRepository: IProfileRepository
  ) {}

  async execute(dto: ChangeRoleDto): Promise<Result<ProfileDto>> {
    try {
      // 현재 사용자 권한 확인 (관리자인지)
      const currentUserResult = await this.profileRepository.findByUserId(dto.userId);
      if (currentUserResult.isFailure) {
        return Result.fail<ProfileDto>(`Failed to find current user: ${currentUserResult.errorValue}`);
      }

      const currentUser = currentUserResult.value;
      if (!currentUser) {
        return Result.fail<ProfileDto>('Current user not found');
      }

      if (!currentUser.isAdmin()) {
        return Result.fail<ProfileDto>('Only admins can change user roles');
      }

      // 대상 사용자 프로필 조회
      const targetProfileResult = await this.profileRepository.findByUserId(dto.targetUserId);
      if (targetProfileResult.isFailure) {
        return Result.fail<ProfileDto>(`Failed to find target user: ${targetProfileResult.errorValue}`);
      }

      const targetProfile = targetProfileResult.value;
      if (!targetProfile) {
        return Result.fail<ProfileDto>('Target user not found');
      }

      // 자기 자신의 역할은 변경 불가 (시스템 보안)
      if (dto.userId === dto.targetUserId) {
        return Result.fail<ProfileDto>('Cannot change your own role');
      }

      // 역할 변경 적용
      const changeRoleResult = targetProfile.changeRole(dto.newRole);
      if (changeRoleResult.isFailure) {
        return Result.fail<ProfileDto>(`Failed to change role: ${changeRoleResult.errorValue}`);
      }

      // 변경사항을 리포지토리에 저장
      const savedProfileResult = await this.profileRepository.save(targetProfile);
      if (savedProfileResult.isFailure) {
        return Result.fail<ProfileDto>(`Failed to save profile: ${savedProfileResult.errorValue}`);
      }

      // DTO로 변환 후 반환
      const updatedProfile = savedProfileResult.value;
      const responseDto = this.mapToDto(updatedProfile);

      return Result.ok<ProfileDto>(responseDto);

    } catch (error) {
      return Result.fail<ProfileDto>(`Unexpected error changing role: ${error}`);
    }
  }

  // Profile 엔티티를 DTO로 변환하는 헬퍼 메서드
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