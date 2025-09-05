import { UseCase } from '../../use-cases/UseCase';
import { IInviteRepository, Result } from '@woodie/domain';
export interface DeleteExpiredInvitesDto {
    olderThanDays?: number;
}
export declare class DeleteExpiredInvitesUseCase implements UseCase<DeleteExpiredInvitesDto, number> {
    private inviteRepository;
    constructor(inviteRepository: IInviteRepository);
    execute(dto: DeleteExpiredInvitesDto): Promise<Result<number>>;
}
//# sourceMappingURL=DeleteExpiredInvitesUseCase.d.ts.map