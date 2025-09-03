import { UseCase } from '../../use-cases/UseCase';
import { Result } from '@woodie/domain';
import { IProfileRepository } from '@woodie/domain';
import { GetProfileDto, ProfileDto } from '../dto/ProfileDto';
export declare class GetProfileUseCase implements UseCase<GetProfileDto, ProfileDto> {
    private profileRepository;
    constructor(profileRepository: IProfileRepository);
    execute(dto: GetProfileDto): Promise<Result<ProfileDto>>;
    private mapToDto;
}
//# sourceMappingURL=GetProfileUseCase.d.ts.map