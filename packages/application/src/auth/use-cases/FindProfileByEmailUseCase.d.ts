import { UseCase } from '../../use-cases/UseCase';
import { IProfileRepository, Profile, Result } from '@woodie/domain';
export interface FindProfileByEmailDto {
    email: string;
}
export declare class FindProfileByEmailUseCase implements UseCase<FindProfileByEmailDto, Profile | null> {
    private profileRepository;
    constructor(profileRepository: IProfileRepository);
    execute(dto: FindProfileByEmailDto): Promise<Result<Profile | null>>;
}
//# sourceMappingURL=FindProfileByEmailUseCase.d.ts.map