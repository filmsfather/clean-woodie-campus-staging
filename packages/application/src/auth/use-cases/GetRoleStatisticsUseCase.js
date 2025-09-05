import { Result } from '@woodie/domain';
export class GetRoleStatisticsUseCase {
    profileRepository;
    constructor(profileRepository) {
        this.profileRepository = profileRepository;
    }
    async execute(dto) {
        try {
            const { schoolId } = dto;
            // 역할별 통계 조회
            const statisticsResult = await this.profileRepository.countByRole(schoolId);
            if (statisticsResult.isFailure) {
                return Result.fail(statisticsResult.errorValue);
            }
            return Result.ok(statisticsResult.value);
        }
        catch (error) {
            console.error('Get role statistics error:', error);
            return Result.fail('Failed to get role statistics');
        }
    }
}
//# sourceMappingURL=GetRoleStatisticsUseCase.js.map