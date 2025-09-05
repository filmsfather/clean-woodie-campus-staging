import { UseCase } from '../../use-cases/UseCase';
import { Result, IInviteRepository, IAuthNotificationService } from '@woodie/domain';
import { CreateInviteDto, InviteDto } from '../dto/InviteDto';
export declare class CreateInviteUseCase implements UseCase<CreateInviteDto, InviteDto> {
    private inviteRepository;
    private notificationService;
    constructor(inviteRepository: IInviteRepository, notificationService: IAuthNotificationService);
    execute(dto: CreateInviteDto): Promise<Result<InviteDto>>;
}
//# sourceMappingURL=CreateInviteUseCase.d.ts.map