import { UseCase } from '../../use-cases/UseCase';
import { IInviteRepository, Result } from '@woodie/domain';
export interface DeleteInviteDto {
    inviteId: string;
    requesterId?: string;
}
export declare class DeleteInviteUseCase implements UseCase<DeleteInviteDto, void> {
    private inviteRepository;
    constructor(inviteRepository: IInviteRepository);
    execute(dto: DeleteInviteDto): Promise<Result<void>>;
}
//# sourceMappingURL=DeleteInviteUseCase.d.ts.map