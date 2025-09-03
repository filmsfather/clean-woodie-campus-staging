import { UseCase } from '../../use-cases/UseCase';
import { Result } from '@woodie/domain';
import { IProfileRepository } from '@woodie/domain';
import { UpdateProfileDto, ProfileDto } from '../dto/ProfileDto';
export declare class UpdateProfileUseCase implements UseCase<UpdateProfileDto, ProfileDto> {
    private profileRepository;
    constructor(profileRepository: IProfileRepository);
    execute(dto: UpdateProfileDto): Promise<Result<ProfileDto>>;
    private mapToDto;
}
//# sourceMappingURL=UpdateProfileUseCase.d.ts.map