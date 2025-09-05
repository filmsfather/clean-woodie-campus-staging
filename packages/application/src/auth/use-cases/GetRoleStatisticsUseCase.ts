import { UseCase } from '../../use-cases/UseCase';
import { IProfileRepository, Result } from '@woodie/domain';

export interface GetRoleStatisticsDto {
  schoolId?: string;
}

export interface RoleStatistics {
  students: number;
  teachers: number;
  admins: number;
}

export class GetRoleStatisticsUseCase implements UseCase<GetRoleStatisticsDto, RoleStatistics> {
  constructor(
    private profileRepository: IProfileRepository
  ) {}

  async execute(dto: GetRoleStatisticsDto): Promise<Result<RoleStatistics>> {
    try {
      const { schoolId } = dto;

      // 역할별 통계 조회
      const statisticsResult = await this.profileRepository.countByRole(schoolId);
      
      if (statisticsResult.isFailure) {
        return Result.fail<RoleStatistics>(statisticsResult.errorValue);
      }

      return Result.ok<RoleStatistics>(statisticsResult.value);

    } catch (error) {
      console.error('Get role statistics error:', error);
      return Result.fail<RoleStatistics>('Failed to get role statistics');
    }
  }
}