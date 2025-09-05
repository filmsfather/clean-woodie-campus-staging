import { UseCase } from '../../use-cases/UseCase';
import { IProfileRepository, Result } from '@woodie/domain';
export interface CheckUserExistsDto {
    userId: string;
}
export declare class CheckUserExistsUseCase implements UseCase<CheckUserExistsDto, boolean> {
    private profileRepository;
    constructor(profileRepository: IProfileRepository);
    execute(dto: CheckUserExistsDto): Promise<Result<boolean>>;
}
//# sourceMappingURL=CheckUserExistsUseCase.d.ts.map