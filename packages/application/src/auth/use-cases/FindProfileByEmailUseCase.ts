import { UseCase } from '../../use-cases/UseCase';
import { IProfileRepository, Profile, Email, Result } from '@woodie/domain';

export interface FindProfileByEmailDto {
  email: string;
}

export class FindProfileByEmailUseCase implements UseCase<FindProfileByEmailDto, Profile | null> {
  constructor(
    private profileRepository: IProfileRepository
  ) {}

  async execute(dto: FindProfileByEmailDto): Promise<Result<Profile | null>> {
    try {
      const { email } = dto;

      // Email 값 객체 생성
      const emailResult = Email.create(email);
      if (emailResult.isFailure) {
        return Result.fail<Profile | null>('Invalid email format');
      }

      // 프로필 조회
      const profileResult = await this.profileRepository.findByEmail(emailResult.value);
      
      if (profileResult.isFailure) {
        return Result.fail<Profile | null>(profileResult.errorValue);
      }

      return Result.ok<Profile | null>(profileResult.value);

    } catch (error) {
      console.error('Find profile by email error:', error);
      return Result.fail<Profile | null>('Failed to find profile by email');
    }
  }
}