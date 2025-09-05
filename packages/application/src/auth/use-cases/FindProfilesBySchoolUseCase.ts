import { UseCase } from '../../use-cases/UseCase';
import { IProfileRepository, Profile, ProfileFilters, Result } from '@woodie/domain';

export interface FindProfilesBySchoolDto {
  schoolId: string;
  filters?: {
    role?: 'student' | 'teacher' | 'admin';
    gradeLevel?: number;
  };
}

export class FindProfilesBySchoolUseCase implements UseCase<FindProfilesBySchoolDto, Profile[]> {
  constructor(
    private profileRepository: IProfileRepository
  ) {}

  async execute(dto: FindProfilesBySchoolDto): Promise<Result<Profile[]>> {
    try {
      const { schoolId, filters } = dto;

      if (!schoolId || schoolId.trim().length === 0) {
        return Result.fail<Profile[]>('School ID is required');
      }

      // 필터 구성
      const profileFilters: ProfileFilters = {};
      if (filters?.role) {
        profileFilters.role = filters.role;
      }
      if (filters?.gradeLevel) {
        profileFilters.gradeLevel = filters.gradeLevel;
      }

      // 학교별 프로필 조회
      const profilesResult = await this.profileRepository.findBySchool(
        schoolId, 
        Object.keys(profileFilters).length > 0 ? profileFilters : undefined
      );
      
      if (profilesResult.isFailure) {
        return Result.fail<Profile[]>(profilesResult.errorValue);
      }

      return Result.ok<Profile[]>(profilesResult.value);

    } catch (error) {
      console.error('Find profiles by school error:', error);
      return Result.fail<Profile[]>('Failed to find profiles by school');
    }
  }
}