import { UseCase } from '../../use-cases/UseCase';
import { Result, UniqueEntityID, Email, Profile, IProfileRepository, FullName } from '@woodie/domain';
import { CreateProfileDto, ProfileDto } from '../dto/ProfileDto';

export class CreateProfileUseCase implements UseCase<CreateProfileDto, ProfileDto> {
  constructor(
    private profileRepository: IProfileRepository
  ) {}

  async execute(dto: CreateProfileDto): Promise<Result<ProfileDto>> {
    try {
      // 이미 프로필이 존재하는지 확인
      const existsResult = await this.profileRepository.existsByUserId(dto.userId);
      if (existsResult.isFailure) {
        return Result.fail<ProfileDto>(`Failed to check existing profile: ${existsResult.errorValue}`);
      }

      if (existsResult.value) {
        return Result.fail<ProfileDto>('Profile already exists for this user');
      }

      // 이메일 중복 확인
      const emailResult = Email.create(dto.email);
      if (emailResult.isFailure) {
        return Result.fail<ProfileDto>(`Invalid email: ${emailResult.errorValue}`);
      }

      const emailExistsResult = await this.profileRepository.existsByEmail(emailResult.value);
      if (emailExistsResult.isFailure) {
        return Result.fail<ProfileDto>(`Failed to check email existence: ${emailExistsResult.errorValue}`);
      }

      if (emailExistsResult.value) {
        return Result.fail<ProfileDto>('Email already exists');
      }

      // 프로필 엔티티 생성
      const profileResult = Profile.create({
        email: dto.email,
        fullName: dto.fullName,
        role: dto.role,
        schoolId: dto.schoolId,
        gradeLevel: dto.gradeLevel
      }, new UniqueEntityID(dto.userId)); // Supabase auth.users.id 사용

      if (profileResult.isFailure) {
        return Result.fail<ProfileDto>(`Failed to create profile: ${profileResult.errorValue}`);
      }

      // 리포지토리에 저장
      const savedProfileResult = await this.profileRepository.save(profileResult.value);
      if (savedProfileResult.isFailure) {
        return Result.fail<ProfileDto>(`Failed to save profile: ${savedProfileResult.errorValue}`);
      }

      // DTO로 변환 후 반환
      const profile = savedProfileResult.value;
      const responseDto = this.mapToDto(profile);

      return Result.ok<ProfileDto>(responseDto);

    } catch (error) {
      return Result.fail<ProfileDto>(`Unexpected error creating profile: ${error}`);
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