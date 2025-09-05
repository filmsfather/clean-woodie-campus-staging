import { UseCase } from '../../use-cases/UseCase';
import { IInviteRepository, Invite, Result } from '@woodie/domain';
export interface FindInvitesByCreatorDto {
    creatorId: string;
}
export declare class FindInvitesByCreatorUseCase implements UseCase<FindInvitesByCreatorDto, Invite[]> {
    private inviteRepository;
    constructor(inviteRepository: IInviteRepository);
    execute(dto: FindInvitesByCreatorDto): Promise<Result<Invite[]>>;
}
//# sourceMappingURL=FindInvitesByCreatorUseCase.d.ts.map