import { Result } from '@woodie/domain';
export class FindProfilesBySchoolUseCase {
    profileRepository;
    constructor(profileRepository) {
        this.profileRepository = profileRepository;
    }
    async execute(dto) {
        try {
            const { schoolId, filters } = dto;
            if (!schoolId || schoolId.trim().length === 0) {
                return Result.fail('School ID is required');
            }
            // 필터 구성
            const profileFilters = {};
            if (filters?.role) {
                profileFilters.role = filters.role;
            }
            if (filters?.gradeLevel) {
                profileFilters.gradeLevel = filters.gradeLevel;
            }
            // 학교별 프로필 조회
            const profilesResult = await this.profileRepository.findBySchool(schoolId, Object.keys(profileFilters).length > 0 ? profileFilters : undefined);
            if (profilesResult.isFailure) {
                return Result.fail(profilesResult.errorValue);
            }
            return Result.ok(profilesResult.value);
        }
        catch (error) {
            console.error('Find profiles by school error:', error);
            return Result.fail('Failed to find profiles by school');
        }
    }
}
//# sourceMappingURL=FindProfilesBySchoolUseCase.js.map