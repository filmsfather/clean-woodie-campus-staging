import { UseCase } from '../../use-cases/UseCase';
import { IInviteRepository, Invite, Result } from '@woodie/domain';
export interface FindPendingInvitesByEmailDto {
    email: string;
}
export declare class FindPendingInvitesByEmailUseCase implements UseCase<FindPendingInvitesByEmailDto, Invite[]> {
    private inviteRepository;
    constructor(inviteRepository: IInviteRepository);
    execute(dto: FindPendingInvitesByEmailDto): Promise<Result<Invite[]>>;
}
//# sourceMappingURL=FindPendingInvitesByEmailUseCase.d.ts.map