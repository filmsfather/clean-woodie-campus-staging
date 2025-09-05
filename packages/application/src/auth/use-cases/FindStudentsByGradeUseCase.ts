import { UseCase } from '../../use-cases/UseCase';
import { IProfileRepository, Profile, Result } from '@woodie/domain';

export interface FindStudentsByGradeDto {
  gradeLevel: number;
  schoolId?: string;
}

export class FindStudentsByGradeUseCase implements UseCase<FindStudentsByGradeDto, Profile[]> {
  constructor(
    private profileRepository: IProfileRepository
  ) {}

  async execute(dto: FindStudentsByGradeDto): Promise<Result<Profile[]>> {
    try {
      const { gradeLevel, schoolId } = dto;

      if (!gradeLevel || gradeLevel < 1) {
        return Result.fail<Profile[]>('Grade level must be at least 1');
      }

      // 학년별 학생 조회
      const profilesResult = await this.profileRepository.findStudentsByGrade(gradeLevel, schoolId);
      
      if (profilesResult.isFailure) {
        return Result.fail<Profile[]>(profilesResult.errorValue);
      }

      return Result.ok<Profile[]>(profilesResult.value);

    } catch (error) {
      console.error('Find students by grade error:', error);
      return Result.fail<Profile[]>('Failed to find students by grade');
    }
  }
}