import { UseCase } from '../../use-cases/UseCase';
import { IInviteRepository, Invite, Result } from '@woodie/domain';
export interface FindInvitesByEmailDto {
    email: string;
}
export declare class FindInvitesByEmailUseCase implements UseCase<FindInvitesByEmailDto, Invite[]> {
    private inviteRepository;
    constructor(inviteRepository: IInviteRepository);
    execute(dto: FindInvitesByEmailDto): Promise<Result<Invite[]>>;
}
//# sourceMappingURL=FindInvitesByEmailUseCase.d.ts.map