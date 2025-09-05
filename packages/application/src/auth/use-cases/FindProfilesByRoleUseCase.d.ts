import { UseCase } from '../../use-cases/UseCase';
import { IProfileRepository, Profile, Result } from '@woodie/domain';
export interface FindProfilesByRoleDto {
    role: 'student' | 'teacher' | 'admin';
}
export declare class FindProfilesByRoleUseCase implements UseCase<FindProfilesByRoleDto, Profile[]> {
    private profileRepository;
    constructor(profileRepository: IProfileRepository);
    execute(dto: FindProfilesByRoleDto): Promise<Result<Profile[]>>;
}
//# sourceMappingURL=FindProfilesByRoleUseCase.d.ts.map