import { UseCase } from '../../use-cases/UseCase';
import { IProfileRepository, Result } from '@woodie/domain';
export interface CheckEmailExistsDto {
    email: string;
}
export declare class CheckEmailExistsUseCase implements UseCase<CheckEmailExistsDto, boolean> {
    private profileRepository;
    constructor(profileRepository: IProfileRepository);
    execute(dto: CheckEmailExistsDto): Promise<Result<boolean>>;
}
//# sourceMappingURL=CheckEmailExistsUseCase.d.ts.map