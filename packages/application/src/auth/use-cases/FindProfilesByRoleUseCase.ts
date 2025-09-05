import { UseCase } from '../../use-cases/UseCase';
import { IProfileRepository, Profile, Result } from '@woodie/domain';

export interface FindProfilesByRoleDto {
  role: 'student' | 'teacher' | 'admin';
}

export class FindProfilesByRoleUseCase implements UseCase<FindProfilesByRoleDto, Profile[]> {
  constructor(
    private profileRepository: IProfileRepository
  ) {}

  async execute(dto: FindProfilesByRoleDto): Promise<Result<Profile[]>> {
    try {
      const { role } = dto;

      if (!role || !['student', 'teacher', 'admin'].includes(role)) {
        return Result.fail<Profile[]>('Invalid role. Must be student, teacher, or admin');
      }

      // 역할별 프로필 조회
      const profilesResult = await this.profileRepository.findByRole(role);
      
      if (profilesResult.isFailure) {
        return Result.fail<Profile[]>(profilesResult.errorValue);
      }

      return Result.ok<Profile[]>(profilesResult.value);

    } catch (error) {
      console.error('Find profiles by role error:', error);
      return Result.fail<Profile[]>('Failed to find profiles by role');
    }
  }
}