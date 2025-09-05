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
export declare class GetRoleStatisticsUseCase implements UseCase<GetRoleStatisticsDto, RoleStatistics> {
    private profileRepository;
    constructor(profileRepository: IProfileRepository);
    execute(dto: GetRoleStatisticsDto): Promise<Result<RoleStatistics>>;
}
//# sourceMappingURL=GetRoleStatisticsUseCase.d.ts.map