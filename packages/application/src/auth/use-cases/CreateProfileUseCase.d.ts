import { UseCase } from '../../use-cases/UseCase';
import { Result, IProfileRepository } from '@woodie/domain';
import { CreateProfileDto, ProfileDto } from '../dto/ProfileDto';
export declare class CreateProfileUseCase implements UseCase<CreateProfileDto, ProfileDto> {
    private profileRepository;
    constructor(profileRepository: IProfileRepository);
    execute(dto: CreateProfileDto): Promise<Result<ProfileDto>>;
    private mapToDto;
}
//# sourceMappingURL=CreateProfileUseCase.d.ts.map