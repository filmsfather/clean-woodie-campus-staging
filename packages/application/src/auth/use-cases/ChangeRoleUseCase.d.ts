import { UseCase } from '../../use-cases/UseCase';
import { Result, IProfileRepository } from '@woodie/domain';
import { ChangeRoleDto, ProfileDto } from '../dto/ProfileDto';
export declare class ChangeRoleUseCase implements UseCase<ChangeRoleDto, ProfileDto> {
    private profileRepository;
    constructor(profileRepository: IProfileRepository);
    execute(dto: ChangeRoleDto): Promise<Result<ProfileDto>>;
    private mapToDto;
}
//# sourceMappingURL=ChangeRoleUseCase.d.ts.map