import { UseCase } from '../../use-cases/UseCase';
import { Result } from '@woodie/domain';
import { IInviteRepository } from '@woodie/domain';
import { UseInviteTokenDto, InviteDto } from '../dto/InviteDto';
export declare class UseInviteTokenUseCase implements UseCase<UseInviteTokenDto, InviteDto> {
    private inviteRepository;
    constructor(inviteRepository: IInviteRepository);
    execute(dto: UseInviteTokenDto): Promise<Result<InviteDto>>;
}
//# sourceMappingURL=UseInviteTokenUseCase.d.ts.map