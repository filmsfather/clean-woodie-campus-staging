import { Result } from '@woodie/domain';
export class FindStudentsByGradeUseCase {
    profileRepository;
    constructor(profileRepository) {
        this.profileRepository = profileRepository;
    }
    async execute(dto) {
        try {
            const { gradeLevel, schoolId } = dto;
            if (!gradeLevel || gradeLevel < 1) {
                return Result.fail('Grade level must be at least 1');
            }
            // 학년별 학생 조회
            const profilesResult = await this.profileRepository.findStudentsByGrade(gradeLevel, schoolId);
            if (profilesResult.isFailure) {
                return Result.fail(profilesResult.errorValue);
            }
            return Result.ok(profilesResult.value);
        }
        catch (error) {
            console.error('Find students by grade error:', error);
            return Result.fail('Failed to find students by grade');
        }
    }
}
//# sourceMappingURL=FindStudentsByGradeUseCase.js.map