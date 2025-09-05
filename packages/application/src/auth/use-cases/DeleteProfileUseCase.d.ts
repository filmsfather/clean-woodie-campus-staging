import { UseCase } from '../../use-cases/UseCase';
import { IProfileRepository, Result } from '@woodie/domain';
export interface DeleteProfileDto {
    userId: string;
    requesterId?: string;
}
export declare class DeleteProfileUseCase implements UseCase<DeleteProfileDto, void> {
    private profileRepository;
    constructor(profileRepository: IProfileRepository);
    execute(dto: DeleteProfileDto): Promise<Result<void>>;
}
//# sourceMappingURL=DeleteProfileUseCase.d.ts.map